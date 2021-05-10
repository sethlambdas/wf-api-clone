import { Logger } from '@nestjs/common';
import { SQS } from 'aws-sdk';
import { find } from 'lodash';
import { Consumer } from 'sqs-consumer';
import { CAT, WorkflowExecution } from './graphql/workflow-executions/workflow-execution.entity';
import { WorkflowExecutionService } from './graphql/workflow-executions/workflow-execution.service';
import { WorkflowStepStatus } from './graphql/workflow-steps/enums/workflow-step-status.enum';
import { WorkflowStep } from './graphql/workflow-steps/workflow-step.entity';
import { WorkflowStepService } from './graphql/workflow-steps/workflow-step.service';
import activityRegistry, { ActivityTypes } from './utils/activity/activity-registry.util';
import { ConfigUtil } from './utils/config.util';
import { putEventsEB } from './utils/event-bridge/event-bridge.util';
import { WORKFLOW_QUEUE_URL } from './utils/sqs/sqs-config.util';
import { changeSQSMessageVisibility } from './utils/sqs/sqs.util';

export default class Workflow {
  private logger: Logger;
  private workflowStepService: WorkflowStepService;
  private workflowExecutionService: WorkflowExecutionService;

  constructor(
    logger: Logger,
    workflowStepService: WorkflowStepService,
    workflowExecutionService: WorkflowExecutionService,
  ) {
    this.logger = logger;
    this.workflowStepService = workflowStepService;
    this.workflowExecutionService = workflowExecutionService;
  }

  static getRule() {
    return 'WorkflowRule';
  }

  static getDetailType() {
    return 'workflowStep';
  }

  static getSource() {
    return 'workflow.initiate';
  }

  private getDetail(message: SQS.Message) {
    const msgPayload = JSON.parse(message.Body);
    const delayedDetail = msgPayload.delayedDetail && JSON.parse(msgPayload.delayedDetail);
    const detail = delayedDetail || msgPayload.detail;
    this.logger.log(msgPayload);
    return detail;
  }

  private async handleMessage(message: SQS.Message) {
    try {
      const detail = this.getDetail(message);
      const { PK, WVID: wfVersionId, WSID: currentWfStepId, parallelIndex, parallelIndexes, wfExecKeys, WLFN } = detail;
      const act: CAT = {
        T: detail?.ACT.T,
        NM: detail?.ACT.NM,
        MD: detail?.ACT.MD,
        WSID: currentWfStepId,
        Status: '',
      };

      if (detail && detail.ACT.END) act.END = detail.ACT.END;

      const wfExec: WorkflowExecution = await this.getCurrentWorkflowExecution(wfExecKeys, act, wfVersionId, PK);

      let currentParallelIndex = (!isNaN(parallelIndex) && parallelIndex) || 0;
      let currentParallelIndexes = parallelIndexes || [];

      try {
        if (detail?.ACT) {
          this.logger.log('================Activity Type===============');
          this.logger.log(act?.T);
          this.logger.log('================Activity Type===============');

          if (activityRegistry[act?.T]) {
            const nextActIds = detail.NAID;
            const parallelStatus = await this.updateParallelStatus(
              wfExec,
              act,
              nextActIds,
              currentParallelIndex,
              currentParallelIndexes,
            );
            currentParallelIndex = parallelStatus.updatedParallelIndex;
            currentParallelIndexes = parallelStatus.updatedParallelIndexes;

            const state = JSON.parse(wfExec.STE);

            this.logger.log('================WF Execution State===============');
            this.logger.log(state);
            this.logger.log('================WF Execution State===============');
            this.logger.log('==================MD===============');
            this.logger.log(act?.MD);
            this.logger.log('==================MD===============');

            const actResult = await activityRegistry[act?.T].processActivity(act?.MD, state);

            this.logger.log('==============Activity Result=================');
            this.logger.log(`${JSON.stringify(actResult)}`);
            this.logger.log('==============Activity Result=================');

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

            const pushEntries = (getWorkflowStep: WorkflowStep) => {
              params.Entries.push({
                Detail: JSON.stringify({
                  ...getWorkflowStep,
                  parallelIndex: currentParallelIndex,
                  parallelIndexes: currentParallelIndexes,
                  wfExecKeys: { PK: wfExec.PK, SK: wfExec.SK },
                  WLFN,
                }),
                DetailType: Workflow.getDetailType(),
                Source: source,
              });
            };

            let workflowStep;
            if (act.T === ActivityTypes.Condition) {
              if (actResult) {
                workflowStep = await this.workflowStepService.getWorkflowStepByAid(actResult as string, PK);

                workflowStep = workflowStep[0];
                this.logger.log(workflowStep);
              }

              pushEntries(workflowStep);
            } else {
              for (const nextActId of nextActIds) {
                this.logger.log('Next Activity ID: ', nextActId);
                workflowStep = await this.workflowStepService.getWorkflowStepByAid(nextActId, PK);

                workflowStep = workflowStep[0];
                this.logger.log(workflowStep);

                pushEntries(workflowStep);
              }
            }

            this.logger.log(params);
            if (act.T === ActivityTypes.ManualApproval) {
              if (typeof actResult === 'function') {
                const executeManualApprovalEB = actResult as (WLFN: string, WSID: string) => any;
                await executeManualApprovalEB(WLFN, currentWfStepId);
                this.logger.log('Waiting for Manual Approval');
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

            await this.updateCATStatus(wfExec, WorkflowStepStatus.Finished);
          }
        }
      } catch (err) {
        await this.updateCATStatus(wfExec, WorkflowStepStatus.Error);
        throw err;
      }
    } catch (err) {
      await this.handleRetries(message);
      this.logger.error(err);
      throw err;
    }
  }

  private async getCurrentWorkflowExecution(wfExecKeys: any, act: CAT, wfVersionId: string, PK: string) {
    let wfExec: WorkflowExecution;
    if (wfExecKeys) {
      wfExec = await this.workflowExecutionService.getWorkflowExecution(wfExecKeys);
      const createCAT = wfExec.CAT;
      act.Status = WorkflowStepStatus.Started;
      createCAT.push({ ...act });
      wfExec = await this.workflowExecutionService.saveWorkflowExecution(
        { PK: wfExec.PK, SK: wfExec.SK },
        {
          CAT: createCAT,
          CRAT: act.T,
        },
      );
    } else if (!wfExecKeys) {
      act.Status = WorkflowStepStatus.Started;
      wfExec = await this.workflowExecutionService.createWorkflowExecution({
        PK,
        WVID: wfVersionId,
        CAT: [{ ...act }],
        STE: '{}',
        CRAT: act.T,
      });
    }
    return wfExec;
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

  private async updateCATStatus(wfExec: WorkflowExecution, status: WorkflowStepStatus) {
    const updateCAT = wfExec.CAT;
    const getCurrentActivity = updateCAT.pop();
    updateCAT.push({ ...getCurrentActivity, Status: status });
    await this.workflowExecutionService.saveWorkflowExecution(
      { PK: wfExec.PK, SK: wfExec.SK },
      {
        CAT: updateCAT,
      },
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
  }
}
