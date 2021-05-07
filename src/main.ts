import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as AWS from 'aws-sdk';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { find } from 'lodash';
import { Consumer } from 'sqs-consumer';
import { AppModule } from './graphql/app.module';
import { CAT, WorkflowExecution } from './graphql/workflow-executions/workflow-execution.entity';
import { WorkflowExecutionService } from './graphql/workflow-executions/workflow-execution.service';
import { WorkflowStepStatus } from './graphql/workflow-steps/enums/workflow-step-status.enum';
import { WorkflowStepService } from './graphql/workflow-steps/workflow-step.service';
import activityRegistry, { ActivityTypes } from './utils/activity/activity-registry.util';
import { ConfigUtil } from './utils/config.util';
import { putEventsEB } from './utils/event-bridge/event-bridge.util';
import localStackInit from './utils/localstack-init.util';
import { WORKFLOW_QUEUE_URL } from './utils/sqs/sqs-config.util';
import { changeSQSMessageVisibility } from './utils/sqs/sqs.util';

AWS.config.update({ region: ConfigUtil.get('aws.region') });

async function bootstrap() {
  const logger = new Logger('bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ConfigUtil.get('logLevel'),
  });
  const workflowStepService = app.get(WorkflowStepService);
  const workflowExecutionService = app.get(WorkflowExecutionService);

  if (process.env.NODE_ENV === 'development') {
    logger.log('Setting up local stack');
    localStackInit();
    logger.log('Finished setting up local stack');
  }

  app.setGlobalPrefix(ConfigUtil.get('server.prefix'));

  const limit = ConfigUtil.get('server.payload.limit');
  app.use(bodyParser.json({ limit }));
  app.use(bodyParser.urlencoded({ limit, extended: true }));

  app.use(cookieParser());

  const origin = ConfigUtil.get('server.origin');
  app.enableCors({ credentials: true, origin });
  logger.log(`Accepting requests from origin "${origin}"`);

  const port = ConfigUtil.get('server.port');
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);

  const workflowSQSQueue = Consumer.create({
    queueUrl: WORKFLOW_QUEUE_URL,
    attributeNames: ['ApproximateReceiveCount'],
    handleMessage: async (message) => {
      try {
        const msgPayload = JSON.parse(message.Body);
        const delayedDetail = msgPayload.delayedDetail && JSON.parse(msgPayload.delayedDetail);
        const detail = delayedDetail || msgPayload.detail;
        const {
          PK,
          WVID: wfVersionId,
          WSID: currentWfStepId,
          parallelIndex,
          parallelIndexes,
          wfExecKeys,
          WLFN,
        } = detail;
        const act: CAT = {
          T: detail?.ACT.T,
          NM: detail?.ACT.NM,
          MD: detail?.ACT.MD,
          WSID: currentWfStepId,
          Status: '',
        };

        if (detail && detail.ACT.END) act.END = detail.ACT.END;

        let wfExec: WorkflowExecution;
        if (wfExecKeys) {
          wfExec = await workflowExecutionService.getWorkflowExecution(wfExecKeys);
          const createCAT = wfExec.CAT;
          act.Status = WorkflowStepStatus.Started;
          createCAT.push({ ...act });
          wfExec = await workflowExecutionService.saveWorkflowExecution(
            { PK: wfExec.PK, SK: wfExec.SK },
            {
              CAT: createCAT,
              CRAT: act.T,
            },
          );
        } else if (!wfExecKeys) {
          act.Status = WorkflowStepStatus.Started;
          wfExec = await workflowExecutionService.createWorkflowExecution({
            PK,
            WVID: wfVersionId,
            CAT: [{ ...act }],
            STE: '{}',
            CRAT: act.T,
          });
        }

        let currentParallelIndex = (!isNaN(parallelIndex) && parallelIndex) || 0;
        const currentParallelIndexes = parallelIndexes || [];

        try {
          logger.log(msgPayload);
          if (detail?.ACT) {
            logger.log('================Activity Type===============');
            logger.log(act?.T);
            logger.log('================Activity Type===============');

            if (activityRegistry[act?.T]) {
              const nextActIds = detail.NAID;
              if (act.T === ActivityTypes.ParallelStart) {
                const PARALLEL = wfExec.PARALLEL || [];
                PARALLEL.push({
                  isParallelActive: true,
                  totalParallelCount: nextActIds.length,
                  finishedParallelCount: 0,
                });
                wfExec = await workflowExecutionService.saveWorkflowExecution(
                  { PK: wfExec.PK, SK: wfExec.SK },
                  {
                    PARALLEL,
                  },
                );
                currentParallelIndex = PARALLEL.length - 1;
                currentParallelIndexes.push(currentParallelIndex);
              }
              if (act.T === ActivityTypes.ParallelEnd) {
                const updatedPARALLEL = wfExec.PARALLEL.map((updateParallel, updateParallelIndex) => {
                  if (updateParallelIndex === currentParallelIndex) {
                    updateParallel.finishedParallelCount = updateParallel.finishedParallelCount + 1;
                  }
                  return updateParallel;
                });
                wfExec = await workflowExecutionService.saveWorkflowExecution(
                  { PK: wfExec.PK, SK: wfExec.SK },
                  {
                    PARALLEL: updatedPARALLEL,
                  },
                );
              }

              const state = JSON.parse(wfExec.STE);

              logger.log('================WF Execution State===============');
              logger.log(state);
              logger.log('================WF Execution State===============');
              logger.log('==================MD===============');
              logger.log(act?.MD);
              logger.log('==================MD===============');

              const actResult = await activityRegistry[act?.T].processActivity(act?.MD, state);

              logger.log('==============Activity Result=================');
              logger.log(`${JSON.stringify(actResult)}`);
              logger.log('==============Activity Result=================');

              const params = {
                Entries: [],
              };

              logger.log('Saving workflow execution');
              let STE = { ...state };
              if (actResult && typeof actResult === 'object' && act.T !== ActivityTypes.Condition) {
                STE = { ...state, ...(actResult as any) };
              }

              const source = 'workflow.initiate';

              await workflowExecutionService.saveWorkflowExecution(
                { PK: wfExec.PK, SK: wfExec.SK },
                {
                  STE: JSON.stringify(STE),
                },
              );
              logger.log('Successfully saved workflow execution');

              let workflowStep;
              if (act.T === ActivityTypes.Condition) {
                if (actResult) {
                  workflowStep = await workflowStepService.getWorkflowStepByAid(actResult as string, PK);

                  workflowStep = workflowStep[0];
                  logger.log(workflowStep);
                }

                params.Entries.push({
                  Detail: JSON.stringify({
                    ...workflowStep,
                    parallelIndex: currentParallelIndex,
                    parallelIndexes: currentParallelIndexes,
                    wfExecKeys: { PK: wfExec.PK, SK: wfExec.SK },
                    WLFN,
                  }),
                  DetailType: `workflowStep`,
                  Source: source,
                });
              } else {
                for (const nextActId of nextActIds) {
                  logger.log('Next Activity ID: ', nextActId);
                  workflowStep = await workflowStepService.getWorkflowStepByAid(nextActId, PK);

                  workflowStep = workflowStep[0];
                  logger.log(workflowStep);

                  params.Entries.push({
                    Detail: JSON.stringify({
                      ...workflowStep,
                      parallelIndex: currentParallelIndex,
                      parallelIndexes: currentParallelIndexes,
                      wfExecKeys: { PK: wfExec.PK, SK: wfExec.SK },
                      WLFN,
                    }),
                    DetailType: `workflowStep`,
                    Source: source,
                  });
                }
              }

              logger.log(params);
              if (act.T === ActivityTypes.ManualApproval) {
                if (typeof actResult === 'function') {
                  const executeManualApprovalEB = actResult as (WLFN: string, WSID: string) => any;
                  await executeManualApprovalEB(WLFN, currentWfStepId);
                  logger.log('Waiting for Manual Approval');
                }
              } else if (act.T === ActivityTypes.Delay) {
                if (typeof actResult === 'function') {
                  const executeDelayEB = actResult as (delayedDetail: any) => any;
                  for (const Entry of params.Entries) {
                    await executeDelayEB(Entry.Detail);
                  }
                  logger.log('Delay activity executing!');
                }
              } else if (act.T === ActivityTypes.ParallelEnd) {
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
                  await workflowExecutionService.saveWorkflowExecution(
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
                  logger.log('Parallel tasks are not yet finished!');
                }
              } else if (act.END) {
                logger.log('Workflow has finished executing!');
              } else {
                await putEventsEB(params);
              }

              const updateCAT = wfExec.CAT;
              const getCurrentActivity = updateCAT.pop();
              updateCAT.push({ ...getCurrentActivity, Status: WorkflowStepStatus.Finished });
              await workflowExecutionService.saveWorkflowExecution(
                { PK: wfExec.PK, SK: wfExec.SK },
                {
                  CAT: updateCAT,
                },
              );
            }
          }
        } catch (err) {
          const catchUpdateCAT = wfExec.CAT;
          const getCurrentActivity = catchUpdateCAT.pop();
          catchUpdateCAT.push({ ...getCurrentActivity, Status: WorkflowStepStatus.Error });
          await workflowExecutionService.saveWorkflowExecution(
            { PK: wfExec.PK, SK: wfExec.SK },
            {
              CAT: catchUpdateCAT,
            },
          );
          throw err;
        }
      } catch (err) {
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
        logger.error(err);
        throw err;
      }
    },
  });

  workflowSQSQueue.on('error', (err) => {
    logger.error(err.message);
  });

  workflowSQSQueue.on('processing_error', (err) => {
    logger.error(err.message);
  });

  workflowSQSQueue.start();
}

bootstrap();
