import { ConfigUtil } from '@lambdascrew/utility';
import { Logger } from '@nestjs/common';
import { SQS } from 'aws-sdk';
import { find } from 'lodash';
import { Consumer } from 'sqs-consumer';
import { v4 } from 'uuid';

import { putEventsEB } from './aws-services/event-bridge/event-bridge.util';
import { WORKFLOW_QUEUE_URL } from './aws-services/sqs/sqs-config.util';
import { changeSQSMessageVisibility } from './aws-services/sqs/sqs.util';
import { ErrorAction } from './graphql/common/enums/web-service.enum';
import activityRegistry, { ActivityTypes, TriggerTypes } from './utils/activity/activity-registry.util';
import { ManualApprovalEmailParams } from './utils/activity/manual-approval.util';
import { ExternalActivityTypes, runExternalService } from './utils/external-activity/external-activities.util';
import { EventParams, ExternalServiceDetails, IDetail, ILoopConfig } from './utils/workflow-types/details.types';

import { CompositePrimaryKey } from './graphql/common/interfaces/workflow-key.interface';
import { CAT, WorkflowExecution } from './graphql/workflow-executions/workflow-execution.entity';
import { WorkflowExecStatus } from './graphql/workflow-executions/workflow-execution.enum';
import { WorkflowExecutionService } from './graphql/workflow-executions/workflow-execution.service';
import {
  CreateWorkflowStepExecutionHistoryInput,
  WebServiceInput,
} from './graphql/workflow-steps-executions-history/inputs/post.inputs';
import { SaveWorkflowStepExecutionHistoryInput } from './graphql/workflow-steps-executions-history/inputs/put.inputs';
import { WorkflowStepExecutionHistory } from './graphql/workflow-steps-executions-history/workflow-steps-wxh.entity';
import { WorkflowStepExecutionHistoryService } from './graphql/workflow-steps-executions-history/workflow-steps-wxh.service';
import { WorkflowStepStatus } from './graphql/workflow-steps/enums/workflow-step-status.enum';
import { WorkflowStep } from './graphql/workflow-steps/workflow-step.entity';
import { WorkflowStepService } from './graphql/workflow-steps/workflow-step.service';
import { WorkflowVersionService } from './graphql/workflow-versions/workflow-version.service';
import { WorkflowService } from './graphql/workflow/workflow.service';
import { BillingService } from './graphql/billing/billing.service';
import { OrganizationService } from './graphql/organizations/organization.service';
import { CreateWorkflowExecutionInput } from './graphql/workflow-executions/inputs/post.inputs';
import { createGlobalVariableObject } from './utils/helpers/global-variable-helpers.util';
import { getMentionedData } from './utils/helpers/string-helpers.util';
import { GlobalVariablesService } from './graphql/global-variables/global-variables.service';

export default class Workflow {
  private logger: Logger;
  private workflowService: WorkflowService;
  private workflowStepService: WorkflowStepService;
  private workflowExecutionService: WorkflowExecutionService;
  private workflowStepExecutionHistoryService: WorkflowStepExecutionHistoryService;
  private workflowVersionService: WorkflowVersionService;
  private billingService: BillingService;
  private organizationService: OrganizationService;
  private globalVariableService: GlobalVariablesService;

  constructor(
    logger: Logger,
    workflowService: WorkflowService,
    workflowStepService: WorkflowStepService,
    workflowExecutionService: WorkflowExecutionService,
    workflowStepExecutionHistoryService: WorkflowStepExecutionHistoryService,
    workflowVersionService: WorkflowVersionService,
    billingService: BillingService,
    organizationService: OrganizationService,
    globalVariableService: GlobalVariablesService,
  ) {
    this.logger = logger;
    this.workflowService = workflowService;
    this.workflowStepService = workflowStepService;
    this.workflowExecutionService = workflowExecutionService;
    this.workflowStepExecutionHistoryService = workflowStepExecutionHistoryService;
    this.workflowVersionService = workflowVersionService;
    this.billingService = billingService;
    this.organizationService = organizationService;
    this.globalVariableService = globalVariableService;
  }

  static getRule() {
    return 'WorkflowRule';
  }

  static getDetailType() {
    return 'service::workflow-engine::run-workflowStep';
  }

  static getSource() {
    return 'workflow.engine';
  }

  private getDetail(message: SQS.Message) {
    const msgPayload = JSON.parse(message.Body);
    let delayedDetail;
    if (msgPayload.delayedDetail && typeof msgPayload.delayedDetail === 'string') {
      delayedDetail = JSON.parse(msgPayload.delayedDetail);
    } else if (msgPayload.delayedDetail) {
      delayedDetail = msgPayload.delayedDetail;
    }

    const detail = delayedDetail || msgPayload.detail;
    this.logger.log(msgPayload);
    return detail;
  }

  private async handleMessage(message: SQS.Message) {
    try {
      const detail: IDetail = this.getDetail(message);
      const {
        isRerun,
        httpTrigger,
        currentWorkflowStep,
        OrgId,
        WorkflowVersionKeys,
        timedTrigger,
        wfExecKeys: WorkflowExecKeys,
        WorkflowStepExecutionHistorySK,
        WLFN,
        ManualApproval,
        parallelIndex,
        parallelIndexes,
        payload,
        externalServiceDetails,
        parentWSXH,
        loopConfig,
      }: IDetail = detail;

      let wfExecKeys = WorkflowExecKeys;
      let globalVariables;
      const act: CAT = {
        T: currentWorkflowStep?.ACT.T,
        NM: currentWorkflowStep?.ACT.NM,
        MD: currentWorkflowStep?.ACT.MD,
        WSID: currentWorkflowStep.SK,
        Status: '',
      };
      if (OrgId) {
        globalVariables = await this.globalVariableService.findOne(`GV|${OrgId}`);
        this.logger.log('globalVariables:', JSON.stringify(globalVariables));
      }
      if (act.T === ActivityTypes.End) {
        await this.workflowExecutionService.saveWorkflowExecution(wfExecKeys, {
          STATUS: WorkflowExecStatus.Finished,
        });

        if (parentWSXH) {
          await this.updateWSXHByKey(parentWSXH.keys, WorkflowStepStatus.Finished);
          await putEventsEB(parentWSXH.nextParentWSXHParams);
        }

        this.logger.log('Workflow has finished executing!');
        return;
      }

      if (act.T === ActivityTypes.EndLoop && loopConfig && loopConfig.currentLoop < loopConfig.maxLoop) {
        const nextLoop = loopConfig.currentLoop + 1;

        this.logger.log(`RERUNNING ACTIVITIES FOR LOOP ${nextLoop}`);

        const workflowStep = await this.workflowStepService.getWorkflowStepByKey(loopConfig.firstLoopActivity);

        const details: IDetail = {
          ...detail,
          currentWorkflowStep: workflowStep,
          loopConfig: {
            ...loopConfig,
            currentLoop: nextLoop,
          },
        };

        const params = {
          Entries: [],
        };

        params.Entries.push({
          Detail: JSON.stringify(details),
          DetailType: Workflow.getDetailType(),
          Source: Workflow.getSource(),
        });

        await putEventsEB(params);

        return;
      }

      const externalService: ExternalServiceDetails = externalServiceDetails;
      let wfExec: WorkflowExecution;
      let wfStepExecHistory: WorkflowStepExecutionHistory;

      if (currentWorkflowStep && currentWorkflowStep.ACT.END) act.END = currentWorkflowStep.ACT.END;

      if (act.MD?.IsTrigger || (Object as any).values(TriggerTypes).includes(act.T)) {
        this.logger.log(`${act.T} Trigger is running.`);
        return;
      }

      if (timedTrigger) {
        const org = await this.organizationService.getOrganization({ PK: OrgId });
        let usageRecord;
        if (org) {
          usageRecord = await this.billingService.reportUsageRecord(OrgId, org.subscriptionId);
          this.logger.log('Stripe usage-record:', usageRecord);
        }
        const WSXH_SK = `WSXH|${OrgId}|Timed|${v4()}`;

        const wfExecData: CreateWorkflowExecutionInput = {
          WorkflowVersionKeys: { PK: WorkflowVersionKeys.PK, SK: `${WorkflowVersionKeys.SK}` },
          STE: '{}',
          WSXH_IDS: [WSXH_SK],
          STATUS: WorkflowExecStatus.Running,
        };

        if (usageRecord) {
          const { usageRecord: record } = usageRecord;
          wfExecData.subscriptionItem = record.subscription_item;
          wfExecData.usageRecordId = record.id;
        }

        const wfExec = await this.workflowExecutionService.createWorkflowExecution(wfExecData);

        wfExecKeys = { PK: wfExec.PK, SK: wfExec.SK };

        await this.UpdateTimedTriggerStepStatus(OrgId, timedTrigger.ACT, timedTrigger.SK, wfExecKeys, WSXH_SK, WLFN);
      }

      if (httpTrigger && httpTrigger.IsHttpTriggered && !externalService) {
        const webServiceHttpTriggerRes = {
          Request: JSON.stringify(httpTrigger.NetworkRequest),
          Result: httpTrigger.httpACT.MD.Body,
          Error: 'None',
        };
        await this.UpdateHttpStepStatus(
          OrgId,
          httpTrigger.httpACT,
          httpTrigger.HTTP_workflowStepSK,
          wfExecKeys,
          httpTrigger.HTTP_WSXH_SK,
          WLFN,
          webServiceHttpTriggerRes,
          httpTrigger.ParentWLFN,
          parentWSXH?.keys.PK,
        );
      }
      if (isRerun) {
        this.logger.log(
          `Rerunning: ${act.T} of workflow step "${currentWorkflowStep.SK}" of execution history "${WorkflowStepExecutionHistorySK}"`,
        );
        const result = await this.rerunWorkflowStepExecutionHistory(wfExecKeys, WorkflowStepExecutionHistorySK);
        wfExec = result.wfExec;
        wfStepExecHistory = result.wfStepExecHistory;
      } else {
        this.logger.log('CREATING/UPDATING workflow execution & workflow step execution history');
        const result = await this.getCurrentWorkflowExecution(
          OrgId,
          act,
          currentWorkflowStep.SK,
          wfExecKeys,
          WorkflowVersionKeys,
          WorkflowStepExecutionHistorySK,
          WLFN,
          loopConfig && act.T !== ActivityTypes.EndLoop ? loopConfig : undefined,
        );
        wfExec = result.wfExec;
        wfStepExecHistory = result.wfStepExecHistory;

        if (result.pause) {
          this.logger.log(`Workflow Execution ${wfExecKeys.PK} is in a Pause state`);
          return;
        }
      }

      const parsedSte = JSON.parse(wfExec.STE);
      let parsedPayload;
      try {
        if (payload) {
          parsedPayload = {
            body: JSON.parse(JSON.parse(JSON.stringify(payload)).body),
          };
        }
      } catch (error) {
        parsedPayload = payload;
      }
      let gvObject = {};
      if (globalVariables) {
        gvObject = createGlobalVariableObject(globalVariables);
      }
      this.logger.log('global variables value:', gvObject);
      const state = {
        ...parsedSte,
        ...(httpTrigger && httpTrigger.IsHttpTriggered
          ? {
            [httpTrigger.httpACT.MD.Name]: {
              ...parsedSte.data,
              ...parsedPayload,
              ...JSON.parse(httpTrigger.httpACT.MD.Body),
            },
          }
          : {}),
        ...(parentWSXH?.state || {}),
        ...gvObject,
        ...(loopConfig ? { [loopConfig.Name]: { ...loopConfig, index: loopConfig.currentLoop } } : {}),
      };

      if ((Object as any).values(ExternalActivityTypes).includes(act.T) && !externalService) {
        const activeWorkflowDetails = {
          ...detail,
          wfExecKeys: { PK: wfExec.PK, SK: wfExec.SK },
          WorkflowStepExecutionHistorySK: wfStepExecHistory.SK,
        };
        const mentionedData = getMentionedData(act.MD.code, state);
        this.logger.log('mentioned data:', mentionedData);
        await runExternalService({ ...act, MD: { ...act.MD, code: mentionedData } }, activeWorkflowDetails);
        return;
      }

      let currentParallelIndex = (!isNaN(parallelIndex) && parallelIndex) || 0;
      let currentParallelIndexes = parallelIndexes || [];

      try {
        if (currentWorkflowStep?.ACT) {
          this.logger.log('================Activity Type===============');
          this.logger.log(act?.T);
          this.logger.log('================Activity Type===============');

          if (
            activityRegistry[act?.T] ||
            (externalService && externalService.isDone) ||
            Object.keys(ActivityTypes).some((key) => ActivityTypes[key] === act.T)
          ) {
            const nextActIds = currentWorkflowStep.NAID;
            const parallelStatus = await this.updateParallelStatus(
              wfExec,
              act,
              nextActIds,
              currentParallelIndex,
              currentParallelIndexes,
            );
            currentParallelIndex = parallelStatus.updatedParallelIndex;
            currentParallelIndexes = parallelStatus.updatedParallelIndexes;

            this.logger.log('================WF Execution State===============');
            this.logger.log(state);
            this.logger.log('================WF Execution State===============');
            this.logger.log('==================MD===============');
            this.logger.log(act?.MD);
            this.logger.log('==================MD===============');

            let actResult: any;

            if (activityRegistry[act?.T]) {
              actResult = await activityRegistry[act?.T].processActivity({ ...act?.MD, WLFN }, state);
              this.logger.log('==============Activity Result=================');
              this.logger.log(`${JSON.stringify(actResult)}`);
              this.logger.log('==============Activity Result=================');
            }

            const params = {
              Entries: [],
            };

            this.logger.log('Saving workflow execution');
            let STE = { ...state };
            if (act.T === ActivityTypes.WebService) {
              const actResultResponse = actResult?.response;
              const result = typeof actResultResponse === 'object' ? actResultResponse : JSON.parse(actResultResponse);
              STE = { ...state, [`${act?.MD.Name}`]: result.body };
            } else if (act.T === ActivityTypes.MatchingData) {
              const actResultResponse = actResult?.result;
              const result = typeof actResultResponse === 'object' ? actResultResponse : JSON.parse(actResultResponse);
              STE = { ...state, [`${act?.MD.Name}`]: result };
            } else if (act.T === ActivityTypes.QueryBuilder || act.T === ActivityTypes.AdvanceQueryBuilder) {
              const actResultResponse = actResult?.dbResult;
              const result = typeof actResultResponse === 'object' ? actResultResponse : JSON.parse(actResultResponse);
              STE = { ...state, [`${act?.MD.Name}`]: result };
            } else if (
              actResult &&
              typeof actResult === 'object' &&
              !actResult.isError &&
              act.T !== ActivityTypes.Condition
            ) {
              STE = { ...state, ...(actResult as any) };
            } else if (externalService && externalService.results) STE = { ...STE, ...externalService.results };

            const source = Workflow.getSource();
            await this.workflowExecutionService.saveWorkflowExecution(
              { PK: wfExec.PK, SK: wfExec.SK },
              {
                STE: JSON.stringify(STE),
              },
            );
            this.logger.log('Successfully saved workflow execution');

            const pushEntries = (getWorkflowStep: WorkflowStep, currentWlfStepResults?: any) => {
              const details: IDetail = {
                currentWorkflowStep: getWorkflowStep,
                parallelIndex: currentParallelIndex,
                parallelIndexes: currentParallelIndexes,
                wfExecKeys: { PK: wfExec.PK, SK: wfExec.SK },
                WLFN,
                OrgId,
                previousStepResults: currentWlfStepResults,
                loopConfig,
              };

              if (parentWSXH) details.parentWSXH = parentWSXH;
              if (act.T === ActivityTypes.StartLoop) {
                details.loopConfig = {
                  Name: act.MD.Name,
                  maxLoop: act.MD.NLoop,
                  currentLoop: 1,
                  firstLoopActivity: { PK: getWorkflowStep.PK, SK: getWorkflowStep.SK },
                };
              }

              params.Entries.push({
                Detail: JSON.stringify(details),
                DetailType: Workflow.getDetailType(),
                Source: source,
              });
            };

            let workflowStep: WorkflowStep;
            if (act.T === ActivityTypes.Condition) {
              if (actResult) {
                workflowStep = await this.workflowStepService.getWorkflowStepByAid({
                  AID: actResult as string,
                  WorkflowStepPK: currentWorkflowStep.PK,
                });

                this.logger.log(workflowStep);
              }

              pushEntries(workflowStep);
            } else if (act.T === ActivityTypes.ManualApproval && ManualApproval) {
              if (ManualApproval.IsApprove)
                workflowStep = await this.workflowStepService.getWorkflowStepByAid({
                  AID: act.MD.ApproveStep,
                  WorkflowStepPK: currentWorkflowStep.PK,
                });
              else if (!ManualApproval.IsApprove && act.MD.RejectStep)
                workflowStep = await this.workflowStepService.getWorkflowStepByAid({
                  AID: act.MD.RejectStep,
                  WorkflowStepPK: currentWorkflowStep.PK,
                });

              this.logger.log(workflowStep);

              pushEntries(workflowStep);
            } else {
              for (const nextActId of nextActIds) {
                this.logger.log('Next Activity ID: ', nextActId);
                workflowStep = await this.workflowStepService.getWorkflowStepByAid({
                  AID: nextActId,
                  WorkflowStepPK: currentWorkflowStep.PK,
                });

                this.logger.log(workflowStep);

                let currentWorkflowStepResults: any;

                if (externalService?.results) currentWorkflowStepResults = externalService.results;

                pushEntries(workflowStep, currentWorkflowStepResults);
              }
            }

            this.logger.log(params);
            if (actResult?.isError) {
              this.logger.log(`Error occured on ${act.NM} named ${act.MD.Name}`);
              this.logger.log(`${act.T}`);

              if (act.T === ActivityTypes.WebService) {
                const webServiceRes = {
                  Request: JSON.stringify(actResult.request),
                  Result: JSON.stringify(actResult.response),
                  Error: actResult.details,
                };

                await this.updateWSXH(wfStepExecHistory, {
                  Status: WorkflowStepStatus.Error,
                  UQ_OVL: WorkflowStepStatus.Error,
                  WEB_SERVICE: webServiceRes,
                });

                if (act.MD.ErrorAction === ErrorAction.STOP) {
                  this.logger.log(`Stopping workflow execution at ${act.T} of ${act.MD.Name}`);
                  await this.workflowExecutionService.saveWorkflowExecution(wfExecKeys, {
                    STATUS: WorkflowExecStatus.Error,
                  });
                } else if (act.MD.ErrorAction === ErrorAction.IGNORE) {
                  if (act.END) {
                    this.logger.log('Workflow has finished executing!');
                  } else {
                    await putEventsEB(params);
                  }
                } else if (act.MD.ErrorAction === ErrorAction.EXITPATH) {
                  const filteredParams: any = {
                    Entries: params.Entries.filter(
                      (entry: any) =>
                        JSON.parse(entry.Detail).currentWorkflowStep.ACT.NM === act.MD.DefaultNext,
                    ),
                  };
                  await putEventsEB(filteredParams);
                } else {
                  if (act.END) {
                    this.logger.log('Workflow has finished executing!');
                  } else {
                    const filteredParams: any = {
                      Entries: params.Entries.filter(
                        (entry: any) =>
                          JSON.parse(entry.Detail).currentWorkflowStep.ACT.DESIGN[0].id === act.MD.DefaultNext,
                      ),
                    };
                    await putEventsEB(filteredParams);
                    this.logger.log('filtered params', filteredParams);
                  }
                }
              } else {
                await this.updateCATStatus(wfStepExecHistory, WorkflowStepStatus.Error);
              }
            } else {
              if (act.T === ActivityTypes.SubWorkflow) {
                await this.runSubWorkflow(
                  act.MD.WorkflowKeys as any,
                  { PK: wfStepExecHistory.PK, SK: wfStepExecHistory.SK },
                  params,
                  state,
                  WLFN,
                );
                return;
              } else if (act.T === ActivityTypes.ManualApproval && !ManualApproval) {
                if (typeof actResult === 'function') {
                  const workflow = await this.workflowService.getWorkflowByName({
                    WorkflowName: WLFN,
                    OrgId,
                  });
                  const workflowVersionSK = wfExec.PK.split('|')[0];
                  const workflowVersion = await this.workflowVersionService.getWorkflowVersionByKey({
                    PK: workflow.PK + '||' + workflow.SK,
                    SK: workflowVersionSK,
                  });
                  const executeManualApprovalEB = actResult as (
                    manualApprovalEmailParams: ManualApprovalEmailParams,
                  ) => any;
                  const manualApprovalEmailParams: ManualApprovalEmailParams = {
                    WorkflowExecutionKeyPK: wfExec.PK,
                    WorkflowExecutionKeySK: wfExec.SK,
                    WorkflowStepKeyPK: currentWorkflowStep.PK,
                    WorkflowStepKeySK: currentWorkflowStep.SK,
                    WorkflowStepExecutionHistorySK: wfStepExecHistory.SK,
                    WorkflowPK: workflow.PK,
                    WorkflowVersionSK: workflowVersion.SK,
                    WorkflowVersion: workflowVersion.WV.toString(),
                    WorkflowName: WLFN,
                    OrgId,
                  };
                  await executeManualApprovalEB(manualApprovalEmailParams);
                  this.logger.log('Waiting for Manual Approval');
                  return;
                }
              } else if (act.T === ActivityTypes.Delay) {
                if (typeof actResult === 'function') {
                  const executeDelayEB = actResult as (delayedDetail: any) => any;
                  for (const Entry of params.Entries) {
                    await executeDelayEB(Entry.Detail);
                  }
                  this.logger.log('Delay activity executing!');
                }
              } else if (act.T === ActivityTypes.ParallelEnd) {
                await this.updateParallelFinished(wfExec, currentParallelIndex, currentParallelIndexes, params);
              } else if (act.T === ActivityTypes.WebService) {
                if (act.MD.ErrorAction === ErrorAction.EXITPATH) {
                  const filteredParams: any = {
                    Entries: params.Entries.filter(
                      (entry: any) =>
                        JSON.parse(entry.Detail).currentWorkflowStep.ACT.NM !== act.MD.DefaultNext,
                    ),
                  };
                  await putEventsEB(filteredParams);
                } else {
                  await putEventsEB(params);
                }
              } else {
                await putEventsEB(params);
              }
              if (act.T === ActivityTypes.WebService) {
                const webServiceRes = {
                  Request: JSON.stringify(actResult.request),
                  Result: actResult.response,
                  Error: 'None',
                };

                await this.updateWSXH(wfStepExecHistory, {
                  Status: WorkflowStepStatus.Finished,
                  UQ_OVL: WorkflowStepStatus.Finished,
                  WEB_SERVICE: webServiceRes,
                });
              } else if (act.T === ActivityTypes.MatchingData) {
                await this.updateWSXH(wfStepExecHistory, {
                  Status: WorkflowStepStatus.Finished,
                  UQ_OVL: WorkflowStepStatus.Finished,
                  MATCH_RESULT: JSON.stringify(actResult.result),
                });
              } else if (act.T === ActivityTypes.QueryBuilder || act.T === ActivityTypes.AdvanceQueryBuilder) {
                await this.updateWSXH(wfStepExecHistory, {
                  Status: WorkflowStepStatus.Finished,
                  UQ_OVL: WorkflowStepStatus.Finished,
                  DB_QUERY_RESULT: JSON.stringify(actResult.dbResult),
                });
              } else {
                await this.updateCATStatus(wfStepExecHistory, WorkflowStepStatus.Finished);
              }
            }
          }
        }
      } catch (err) {
        await this.updateCATStatus(wfStepExecHistory, WorkflowStepStatus.Error);
        throw err;
      }
    } catch (err) {
      await this.handleRetries(message);
      this.logger.error('Error Occured:');
      this.logger.error(err);
      throw err;
    }
  }

  private async createStepExecHistory(
    OrgId: string,
    wfExecPK: string,
    WSXH_SK: string,
    act: CAT,
    CurrentWorkflowStepSK: string,
    WorkflowName: string,
    webServiceTriggerResult?: WebServiceInput,
    ParentWLFN?: string,
    ParentWLFID?: string,
  ) {
    const inputs: CreateWorkflowStepExecutionHistoryInput = {
      OrgId,
      PK: wfExecPK,
      SK: WSXH_SK,
      T: act.T,
      NM: act.NM,
      WLFN: WorkflowName,
      WorkflowStepSK: CurrentWorkflowStepSK,
      Status: act.Status,
      UQ_OVL: act.Status,
    };
    this.logger.log('webServiceTriggerResult: ', webServiceTriggerResult);
    if (act.MD) inputs.MD = act.MD;
    if (act.END) inputs.END = act.END;

    if (webServiceTriggerResult) {
      if (webServiceTriggerResult.Request && webServiceTriggerResult.Result && webServiceTriggerResult.Error) {
        inputs.WEB_SERVICE = webServiceTriggerResult;
      } else {
        inputs.WEB_SERVICE = {
          Request: JSON.stringify({ ParentWorkflowName: ParentWLFN, ParentWorkflowID: ParentWLFID }),
        };
      }
    }
    return await this.workflowStepExecutionHistoryService.createWorkflowStepExecutionHistory(inputs);
  }

  private async getCurrentWorkflowExecution(
    OrgId: string,
    act: CAT,
    CurrentWorkflowStepSK: string,
    wfExecKeys: any,
    WorkflowVersionKeys: { PK: string; SK: string },
    WorkflowStepExecutionHistorySK: string,
    WorkflowName: string,
    loopConfig?: ILoopConfig,
  ) {
    let wfExec: WorkflowExecution;
    let wfStepExecHistory: WorkflowStepExecutionHistory;

    const ActivityType = act.T.replace(' ', '');
    const WSXH_SK = loopConfig
      ? `WSXH|LOOP-${loopConfig.currentLoop}|${OrgId}|${ActivityType}|${v4()}`
      : `WSXH|${OrgId}|${ActivityType}|${v4()}`;
    if (wfExecKeys) {
      wfExec = await this.workflowExecutionService.getWorkflowExecutionByKey(wfExecKeys);

      if (wfExec.STATUS === WorkflowStepStatus.Pause) {
        act.Status = WorkflowStepStatus.Pause;
        wfStepExecHistory = await this.createStepExecHistory(
          OrgId,
          wfExec.PK,
          WSXH_SK,
          act,
          CurrentWorkflowStepSK,
          WorkflowName,
        );

        return { pause: true };
      }
      act.Status = WorkflowStepStatus.Started;

      wfExec = await this.workflowExecutionService.saveWorkflowExecution(wfExecKeys, {
        WSXH_IDS: [...wfExec.WSXH_IDS, WSXH_SK],
      });

      if (WorkflowStepExecutionHistorySK)
        wfStepExecHistory = await this.workflowStepExecutionHistoryService.getWorkflowStepExecutionHistoryByKey({
          PK: wfExecKeys.PK,
          SK: WorkflowStepExecutionHistorySK,
        });
      else {
        wfStepExecHistory = await this.createStepExecHistory(
          OrgId,
          wfExec.PK,
          WSXH_SK,
          act,
          CurrentWorkflowStepSK,
          WorkflowName,
        );
      }
    } else if (!wfExecKeys) {
      act.Status = WorkflowStepStatus.Started;
      wfExec = await this.workflowExecutionService.createWorkflowExecution({
        WorkflowVersionKeys,
        STE: '{}',
        WSXH_IDS: [WSXH_SK],
        STATUS: WorkflowExecStatus.Running,
      });
      wfStepExecHistory = await this.createStepExecHistory(
        OrgId,
        wfExec.PK,
        WSXH_SK,
        act,
        CurrentWorkflowStepSK,
        WorkflowName,
      );
    }

    return { wfExec, wfStepExecHistory };
  }

  private async rerunWorkflowStepExecutionHistory(wfExecKeys: any, WorkflowStepExecutionHistorySK: string) {
    const wfExec = await this.workflowExecutionService.getWorkflowExecutionByKey(wfExecKeys);

    const wfStepExecHistory = await this.workflowStepExecutionHistoryService.saveWorkflowStepExecutionHistory(
      { PK: wfExec.PK, SK: WorkflowStepExecutionHistorySK },
      { Status: WorkflowStepStatus.Started },
    );

    return { wfExec, wfStepExecHistory };
  }

  private async UpdateHttpStepStatus(
    OrgId: string,
    act: CAT,
    CurrentWorkflowStepSK: string,
    wfExecKeys: any,
    WSXH_SK: string,
    WorkflowName: string,
    webServiceTriggerResult?: WebServiceInput,
    ParentWLFN?: string,
    ParentWLFID?: string,
  ) {
    act.Status = WorkflowStepStatus.Finished;
    // TODO: add also ID here
    await this.createStepExecHistory(
      OrgId,
      wfExecKeys.PK,
      WSXH_SK,
      act,
      CurrentWorkflowStepSK,
      WorkflowName,
      webServiceTriggerResult,
      ParentWLFN,
      ParentWLFID,
    );
  }

  private async UpdateTimedTriggerStepStatus(
    OrgId: string,
    act: CAT,
    CurrentWorkflowStepSK: string,
    wfExecKeys: any,
    WSXH_SK: string,
    WorkflowName: string,
  ) {
    act.Status = WorkflowStepStatus.Finished;
    await this.createStepExecHistory(OrgId, wfExecKeys.PK, WSXH_SK, act, CurrentWorkflowStepSK, WorkflowName);
  }

  private async updateParallelStatus(
    wfExec: WorkflowExecution,
    act: CAT,
    nextActIds: any,
    currentParallelIndex: number,
    currentParallelIndexes: number[],
  ) {
    let updatedParallelIndex = currentParallelIndex;
    const updatedParallelIndexes = currentParallelIndexes;
    if (act.T === ActivityTypes.ParallelStart) {
      const PARALLEL = wfExec.PARALLEL || [];
      PARALLEL.push({
        isParallelActive: true,
        totalParallelCount: nextActIds.length,
        finishedParallelCount: 0,
      });
      wfExec = await this.workflowExecutionService.saveWorkflowExecution(
        { PK: wfExec.PK, SK: wfExec.SK },
        {
          PARALLEL,
        },
      );
      updatedParallelIndex = PARALLEL.length - 1;
      updatedParallelIndexes.push(updatedParallelIndex);
    }
    if (act.T === ActivityTypes.ParallelEnd) {
      const updatedPARALLEL = wfExec.PARALLEL.map((updateParallel, updateParallelIndex) => {
        if (updateParallelIndex === updatedParallelIndex) {
          updateParallel.finishedParallelCount = updateParallel.finishedParallelCount + 1;
        }
        return updateParallel;
      });
      wfExec = await this.workflowExecutionService.saveWorkflowExecution(
        { PK: wfExec.PK, SK: wfExec.SK },
        {
          PARALLEL: updatedPARALLEL,
        },
      );
    }
    return {
      updatedParallelIndex,
      updatedParallelIndexes,
    };
  }

  private async updateParallelFinished(
    wfExec: WorkflowExecution,
    currentParallelIndex: number,
    currentParallelIndexes: number[],
    params = {
      Entries: [],
    },
  ) {
    const currentPARALLEL = find(wfExec.PARALLEL, null, currentParallelIndex);
    const finishedParallelCount = currentPARALLEL.finishedParallelCount;
    const totalParallelCount = currentPARALLEL.totalParallelCount;
    const isParallelActive = currentPARALLEL.isParallelActive;
    if (finishedParallelCount === totalParallelCount && isParallelActive) {
      const updatedPARALLEL = wfExec.PARALLEL.map((updateParallel, updateParallelIndex) => {
        if (updateParallelIndex === currentParallelIndex) {
          updateParallel.isParallelActive = false;
        }
        return updateParallel;
      });
      await this.workflowExecutionService.saveWorkflowExecution(
        { PK: wfExec.PK, SK: wfExec.SK },
        {
          PARALLEL: updatedPARALLEL,
        },
      );
      const updatedParallelIndexes = currentParallelIndexes.filter((filterParallelIndex) => {
        return filterParallelIndex !== currentParallelIndex;
      });
      params.Entries = params.Entries.map((Entry) => {
        const Detail = JSON.parse(Entry.Detail);
        Detail.parallelIndexes = updatedParallelIndexes;
        Detail.parallelIndex = find(updatedParallelIndexes, null, updatedParallelIndexes.length - 1);
        Entry.Detail = JSON.stringify(Detail);
        return Entry;
      });
      await putEventsEB(params);
    } else {
      this.logger.log('Parallel tasks are not yet finished!');
    }
  }

  private async updateCATStatus(wfStepExecHistory: WorkflowStepExecutionHistory, status: WorkflowStepStatus) {
    const saveWorkflowStepExecutionHistoryInput: SaveWorkflowStepExecutionHistoryInput = {
      Status: status,
      UQ_OVL: status,
    };
    await this.workflowStepExecutionHistoryService.saveWorkflowStepExecutionHistory(
      { PK: wfStepExecHistory.PK, SK: wfStepExecHistory.SK },
      saveWorkflowStepExecutionHistoryInput,
    );
  }

  private async updateWSXH(
    wfStepExecHistory: WorkflowStepExecutionHistory,
    data: SaveWorkflowStepExecutionHistoryInput,
  ) {
    await this.workflowStepExecutionHistoryService.saveWorkflowStepExecutionHistory(
      { PK: wfStepExecHistory.PK, SK: wfStepExecHistory.SK },
      data,
    );
  }

  private async updateWSXHByKey(keys: CompositePrimaryKey, status: WorkflowStepStatus) {
    await this.workflowStepExecutionHistoryService.saveWorkflowStepExecutionHistory(keys, {
      Status: status,
      UQ_OVL: status,
    });
  }

  private async runSubWorkflow(
    subWorkflowKeys: CompositePrimaryKey,
    parentWSXHKeys: CompositePrimaryKey,
    nextParentWSXHParams: EventParams,
    parentWorkflowState?: any,
    WLFN?: string,
  ) {
    this.logger.log('RUN SUB WORKFLOW');
    const workflow = await this.workflowService.getWorkflowByKey(subWorkflowKeys);

    const workflowStep = await this.workflowStepService.getWorkflowStepByAid({
      AID: workflow.FAID,
      WorkflowStepPK: 'WV#',
    });

    const paramsEB = {
      Entries: [],
    };

    if (workflowStep.NAID.length > 0) {
      const workflowVersion = await this.workflowVersionService.getWorkflowVersionBySK({
        PK: 'ORG#',
        SK: workflowStep.PK,
      });

      const WSXH_SK = `WSXH|${workflowStep.ACT.MD.OrgId}|HTTP|${v4()}`;
      const wfExec = await this.workflowExecutionService.createWorkflowExecution({
        WorkflowVersionKeys: { PK: workflowVersion.PK, SK: `${workflowVersion.SK}` },
        STE: '{}',
        WSXH_IDS: [WSXH_SK],
        STATUS: WorkflowExecStatus.Running,
      });

      const httpACT: CAT = {
        T: workflowStep?.ACT.T,
        NM: workflowStep?.ACT.NM,
        MD: workflowStep?.ACT.MD,
        WSID: workflowStep.SK,
        Status: '',
      };

      const httpTrigger = {
        IsHttpTriggered: true,
        httpACT,
        HTTP_WSXH_SK: WSXH_SK,
        HTTP_workflowStepSK: workflowStep.SK,
        ParentWLFN: WLFN,
      };

      let i = 0;

      for (const nextActId of workflowStep.NAID) {
        this.logger.log('Next Activity ID: ', nextActId);
        const getWorkflowStep = await this.workflowStepService.getWorkflowStepByAid({
          AID: nextActId,
          WorkflowStepPK: workflowStep.PK,
        });

        const WorkflowPKSplit = workflowVersion.PK.split('|');
        const OrgId = WorkflowPKSplit[0];
        const detail: IDetail = {
          currentWorkflowStep: getWorkflowStep,
          WLFN: workflow.WLFN,
          WorkflowVersionKeys: {
            PK: workflowVersion.PK,
            SK: `${workflowVersion.SK}`,
          },
          wfExecKeys: {
            PK: wfExec.PK,
            SK: wfExec.SK,
          },
          OrgId,
          parentWSXH: {
            keys: parentWSXHKeys,
            nextParentWSXHParams,
            state: parentWorkflowState || {},
          },
        };

        if (i === 0) {
          detail.httpTrigger = { ...httpTrigger };
          ++i;
        }

        paramsEB.Entries.push({
          Detail: JSON.stringify(detail),
          DetailType: Workflow.getDetailType(),
          Source: Workflow.getSource(),
        });
      }
      await putEventsEB(paramsEB);
    }
  }

  private async handleRetries(message: SQS.Message) {
    const {
      Attributes: { ApproximateReceiveCount },
    } = message;
    const receiveCount = +ApproximateReceiveCount - 1;
    const maxRetriesLimit = +ConfigUtil.get('sqs.maxRetriesLimit');
    if (receiveCount < maxRetriesLimit) {
      const maxRetriesIntervalSeconds = ConfigUtil.get('sqs.maxRetriesIntervalSeconds');
      const defaultIntervalSecond = find(maxRetriesIntervalSeconds, null, 0);
      const maxRetriesIntervalSecond = find(maxRetriesIntervalSeconds, null, receiveCount) || defaultIntervalSecond;
      const visibilityParams = {
        QueueUrl: WORKFLOW_QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle,
        VisibilityTimeout: maxRetriesIntervalSecond,
      };
      await changeSQSMessageVisibility(visibilityParams);
    }
  }

  private onSQSQueueError(err: Error) {
    const { message } = err;
    this.logger.error(message);
  }

  async run() {
    const workflowSQSQueue = Consumer.create({
      queueUrl: WORKFLOW_QUEUE_URL,
      attributeNames: ['ApproximateReceiveCount'],
      handleMessage: (message: SQS.Message) => this.handleMessage(message),
    });

    workflowSQSQueue.on('error', (err: Error) => this.onSQSQueueError(err));

    workflowSQSQueue.on('processing_error', (err: Error) => this.onSQSQueueError(err));

    workflowSQSQueue.start();

    this.logger.log(`CHECKING SQS CONSUMER IF RUNNING: ${workflowSQSQueue.isRunning}`);
  }
}
