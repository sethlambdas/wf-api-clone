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
import localStackInit from './utils/localStack-init.util';
import { WORKFLOW_QUEUE_URL } from './utils/sqs/sqs-config.util';

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
    handleMessage: async (message) => {
      const msgPayload = JSON.parse(message.Body);
      const delayedDetail = msgPayload.delayedDetail && JSON.parse(msgPayload.delayedDetail);
      const detail = delayedDetail || msgPayload.detail;
      const { WVID: wfVersionId, WSID: currentWfStepId, parallelIndex, parallelIndexes } = detail;
      const act: CAT = detail?.ACT;
      if (act) act.WSID = currentWfStepId;

      const wfExecs = await workflowExecutionService.queryWorkflowExecution({
        WVID: { eq: wfVersionId },
      });

      let wfExec: WorkflowExecution;
      if (wfExecs.length === 1) {
        wfExec = wfExecs[0];
        const createCAT = wfExec.CAT;
        createCAT.push({ ...act, Status: WorkflowStepStatus.Started });
        wfExec = await workflowExecutionService.saveWorkflowExecution(wfExec.WXID, {
          WSID: currentWfStepId,
          CAT: createCAT,
        });
      } else if (!wfExecs.length) {
        wfExec = await workflowExecutionService.createWorkflowExecution({
          WVID: wfVersionId,
          CAT: [{ ...act, Status: WorkflowStepStatus.Started }],
          STE: '{}',
          WSID: currentWfStepId,
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
              wfExec = await workflowExecutionService.saveWorkflowExecution(wfExec.WXID, {
                PARALLEL,
              });
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
              wfExec = await workflowExecutionService.saveWorkflowExecution(wfExec.WXID, {
                PARALLEL: updatedPARALLEL,
              });
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

            await workflowExecutionService.saveWorkflowExecution(wfExec.WXID, {
              STE: JSON.stringify(STE),
            });
            logger.log('Successfully saved workflow execution');

            let workflowStep;
            if (act.T === ActivityTypes.Condition) {
              if (actResult) {
                workflowStep = await workflowStepService.queryWorkflowStep({
                  AID: { eq: actResult },
                });

                workflowStep = workflowStep[0];
                logger.log(workflowStep);
              }

              params.Entries.push({
                Detail: JSON.stringify({
                  ...workflowStep,
                  parallelIndex: currentParallelIndex,
                  parallelIndexes: currentParallelIndexes,
                }),
                DetailType: `workflowStep`,
                Source: source,
              });
            } else {
              for (const nextActId of nextActIds) {
                logger.log('Next Activity ID: ', nextActId);
                workflowStep = await workflowStepService.queryWorkflowStep({
                  AID: { eq: nextActId },
                });

                workflowStep = workflowStep[0];
                logger.log(workflowStep);

                params.Entries.push({
                  Detail: JSON.stringify({
                    ...workflowStep,
                    parallelIndex: currentParallelIndex,
                    parallelIndexes: currentParallelIndexes,
                  }),
                  DetailType: `workflowStep`,
                  Source: source,
                });
              }
            }

            logger.log(params);
            if (act.T === ActivityTypes.ManualInput && !act.MD.Completed) {
              logger.log('Waiting for Manual Input');
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
                await workflowExecutionService.saveWorkflowExecution(wfExec.WXID, {
                  PARALLEL: updatedPARALLEL,
                });
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
            await workflowExecutionService.saveWorkflowExecution(wfExec.WXID, {
              CAT: updateCAT,
            });
          }
        }
      } catch (err) {
        const catchUpdateCAT = wfExec.CAT;
        const getCurrentActivity = catchUpdateCAT.pop();
        catchUpdateCAT.push({ ...getCurrentActivity, Status: WorkflowStepStatus.Error });
        await workflowExecutionService.saveWorkflowExecution(wfExec.WXID, {
          CAT: catchUpdateCAT,
        });
        logger.error(err);
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
