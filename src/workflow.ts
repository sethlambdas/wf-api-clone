import { Logger } from '@nestjs/common';
import { SQS } from 'aws-sdk';
import { find } from 'lodash';
import { Consumer } from 'sqs-consumer';
import { v4 } from 'uuid';
import { CAT, WorkflowExecution } from './graphql/workflow-executions/workflow-execution.entity';
import { WorkflowExecutionService } from './graphql/workflow-executions/workflow-execution.service';
import { CreateWorkflowStepExecutionHistoryInput } from './graphql/workflow-steps-executions-history/inputs/create.input';
import { WorkflowStepExecutionHistory } from './graphql/workflow-steps-executions-history/workflow-steps-wxh.entity';
import { WorkflowStepExecutionHistoryService } from './graphql/workflow-steps-executions-history/workflow-steps-wxh.service';
import { WorkflowStepStatus } from './graphql/workflow-steps/enums/workflow-step-status.enum';
import { WorkflowStep } from './graphql/workflow-steps/workflow-step.entity';
import { WorkflowStepService } from './graphql/workflow-steps/workflow-step.service';
import { WorkflowVersionService } from './graphql/workflow-versions/workflow-version.service';
import { WorkflowService } from './graphql/workflow/workflow.service';
import activityRegistry, { ActivityTypes, TriggerTypes } from './utils/activity/activity-registry.util';
import { ManualApprovalEmailParams } from './utils/activity/manual-approval.util';
import { ConfigUtil } from './utils/config.util';
import { putEventsEB } from './utils/event-bridge/event-bridge.util';
import { ExternalActivityTypes, runExternalService } from './utils/external-activity/external-activities.util';
import { WORKFLOW_QUEUE_URL } from './utils/sqs/sqs-config.util';
import { changeSQSMessageVisibility } from './utils/sqs/sqs.util';
import { ExternalServiceDetails } from './utils/workflow-types/details.types';
import { IDetail } from './utils/workflow-types/details.types';

export default class Workflow {
  private logger: Logger;
  private workflowService: WorkflowService;
  private workflowStepService: WorkflowStepService;
  private workflowExecutionService: WorkflowExecutionService;
  private workflowStepExecutionHistoryService: WorkflowStepExecutionHistoryService;
  private workflowVersionService: WorkflowVersionService;

  constructor(
    logger: Logger,
    workflowService: WorkflowService,
    workflowStepService: WorkflowStepService,
    workflowExecutionService: WorkflowExecutionService,
    workflowStepExecutionHistoryService: WorkflowStepExecutionHistoryService,
    workflowVersionService: WorkflowVersionService,
  ) {
    this.logger = logger;
    this.workflowService = workflowService;
    this.workflowStepService = workflowStepService;
    this.workflowExecutionService = workflowExecutionService;
    this.workflowStepExecutionHistoryService = workflowStepExecutionHistoryService;
    this.workflowVersionService = workflowVersionService;
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
        currentWorkflowStep,
        OrgId,
        WorkflowVersionKeys,
        wfExecKeys,
        WorkflowStepExecutionHistorySK,
        WLFN,
        ManualApproval,
        parallelIndex,
        parallelIndexes,
        payload,
        externalServiceDetails,
      }: IDetail = detail;

      const act: CAT = {
        T: currentWorkflowStep?.ACT.T,
        NM: currentWorkflowStep?.ACT.NM,
        MD: currentWorkflowStep?.ACT.MD,
        WSID: currentWorkflowStep.SK,
        Status: '',
      };

      const externalService: ExternalServiceDetails = externalServiceDetails;

      if (currentWorkflowStep && currentWorkflowStep.ACT.END) act.END = currentWorkflowStep.ACT.END;

      const { wfExec, wfStepExecHistory } = await this.getCurrentWorkflowExecution(
        OrgId,
        act,
        currentWorkflowStep.SK,
        wfExecKeys,
        WorkflowVersionKeys,
        WorkflowStepExecutionHistorySK,
        WLFN,
      );

      if (act.MD?.IsTrigger || (Object as any).values(TriggerTypes).includes(act.T)) {
        this.logger.log(`${act.T} Trigger is running.`);
        return;
      }

      if ((Object as any).values(ExternalActivityTypes).includes(act.T) && !externalService) {
        const activeWorkflowDetails = {
          ...detail,
          wfExecKeys: { PK: wfExec.PK, SK: wfExec.SK },
          WorkflowStepExecutionHistorySK: wfStepExecHistory.SK,
        };
        await runExternalService(act, activeWorkflowDetails);
        return;
      }

      let currentParallelIndex = (!isNaN(parallelIndex) && parallelIndex) || 0;
      let currentParallelIndexes = parallelIndexes || [];

      try {
        if (currentWorkflowStep?.ACT) {
          this.logger.log('================Activity Type===============');
          this.logger.log(act?.T);
          this.logger.log('================Activity Type===============');

          if (activityRegistry[act?.T] || externalService.isDone) {
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

            const state = {
              ...JSON.parse(wfExec.STE),
              ...(payload || {}),
            };

            this.logger.log('================WF Execution State===============');
            this.logger.log(state);
            this.logger.log('================WF Execution State===============');
            this.logger.log('==================MD===============');
            this.logger.log(act?.MD);
            this.logger.log('==================MD===============');

            let actResult: any;

            if (activityRegistry[act?.T]) {
              actResult = await activityRegistry[act?.T].processActivity(act?.MD, state);
              this.logger.log('==============Activity Result=================');
              this.logger.log(`${JSON.stringify(actResult)}`);
              this.logger.log('==============Activity Result=================');
            }

            const params = {
              Entries: [],
            };

            this.logger.log('Saving workflow execution');
            let STE = { ...state };
            if (actResult && typeof actResult === 'object' && act.T !== ActivityTypes.Condition) {
              STE = { ...state, ...(actResult as any) };
            }

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
              };

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

                if (externalService.results) currentWorkflowStepResults = externalService.results;

                pushEntries(workflowStep, currentWorkflowStepResults);
              }
            }

            this.logger.log(params);
            if (act.T === ActivityTypes.ManualApproval && !ManualApproval) {
              if (typeof actResult === 'function') {
                const workflow = await this.workflowService.getWorkflowByName({
                  WorkflowName: WLFN,
                  OrgId,
                });
                const workflowVersionSK = wfExec.PK.split('|')[0];
                const workflowVersion = await this.workflowVersionService.getWorkflowVersionByKey({
                  PK: workflow.PK,
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
            } else if (act.END) {
              this.logger.log('Workflow has finished executing!');
            } else {
              await putEventsEB(params);
            }

            await this.updateCATStatus(wfStepExecHistory, WorkflowStepStatus.Finished);
          }
        }
      } catch (err) {
        await this.updateCATStatus(wfStepExecHistory, WorkflowStepStatus.Error);
        throw err;
      }
    } catch (err) {
      await this.handleRetries(message);
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
    };

    if (act.MD) inputs.MD = act.MD;
    if (act.END) inputs.END = act.END;

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
  ) {
    let wfExec: WorkflowExecution;
    let wfStepExecHistory: WorkflowStepExecutionHistory;

    const ActivityType = act.T.replace(' ', '');
    const WSXH_SK = `WSXH|${OrgId}|${ActivityType}|${v4()}`;

    if (wfExecKeys) {
      act.Status = WorkflowStepStatus.Started;

      wfExec = await this.workflowExecutionService.getWorkflowExecutionByKey(wfExecKeys);

      wfExec = await this.workflowExecutionService.saveWorkflowExecution(wfExecKeys, {
        WSXH_IDS: [...wfExec.WSXH_IDS, WSXH_SK],
      });

      if (WorkflowStepExecutionHistorySK)
        wfStepExecHistory = await this.workflowStepExecutionHistoryService.getWorkflowStepExecutionHistoryByKey({
          PK: wfExecKeys.PK,
          SK: WorkflowStepExecutionHistorySK,
        });
      else
        wfStepExecHistory = await this.createStepExecHistory(
          OrgId,
          wfExec.PK,
          WSXH_SK,
          act,
          CurrentWorkflowStepSK,
          WorkflowName,
        );
    } else if (!wfExecKeys) {
      act.Status = WorkflowStepStatus.Started;
      wfExec = await this.workflowExecutionService.createWorkflowExecution({
        WorkflowVersionKeys,
        STE: '{}',
        WSXH_IDS: [WSXH_SK],
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
    await this.workflowStepExecutionHistoryService.saveWorkflowStepExecutionHistory(
      { PK: wfStepExecHistory.PK, SK: wfStepExecHistory.SK },
      { Status: status },
    );
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
