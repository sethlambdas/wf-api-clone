import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as AWS from 'aws-sdk';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { Consumer } from 'sqs-consumer';
import { AppModule } from './graphql/app.module';
import { WorkflowExecutionService } from './graphql/workflow-executions/workflow-execution.service';
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
      try {
        const msgPayload = JSON.parse(message.Body);
        logger.log(msgPayload);
        if (msgPayload?.detail?.ACT) {
          const act = JSON.parse(msgPayload?.detail?.ACT);
          const { WVID: wfVersionId, WSID: currentWfStepId } = msgPayload.detail;

          const wfExecs = (await workflowExecutionService.queryWorkflowExecution({
            WVID: wfVersionId,
          })) as any;

          let wfExec;
          if (wfExecs.length === 1) {
            wfExec = wfExecs[0];
          } else if (!wfExecs.length) {
            wfExec = await workflowExecutionService.createWorkflowExecution({
              WVID: wfVersionId,
              CAT: JSON.stringify(act),
              STE: '{}',
              WSID: currentWfStepId,
            });
          }

          logger.log('================Activity Type===============');
          logger.log(act?.T);
          logger.log('================Activity Type===============');

          if (activityRegistry[act?.T]) {
            const nextActIds = JSON.parse(msgPayload.detail.NAID);
            if (act.T === ActivityTypes.ParallelStart) {
              wfExec = await workflowExecutionService.saveWorkflowExecution(wfExec.WXID, {
                isParallel: true,
                totalParallelCount: nextActIds.length,
                finishedParallelCount: 0,
              });
            }
            if (act.T === ActivityTypes.ParallelEnd) {
              wfExec = await workflowExecutionService.saveWorkflowExecution(wfExec.WXID, {
                finishedParallelCount: wfExec.finishedParallelCount + 1,
              });
            }

            console.log(wfExec);
            const state = JSON.parse(wfExec.STE);

            logger.log('================WF Execution State===============');
            logger.log(state);
            logger.log('================WF Execution State===============');
            logger.log('==================MD===============');
            logger.log(act?.MD);
            logger.log('==================MD===============');

            const actResult = await activityRegistry[act?.T].processActivity(act?.MD);

            logger.log('==============Activity Result=================');
            console.log(actResult);
            logger.log(actResult as any);
            logger.log('==============Activity Result=================');

            const params = {
              Entries: [],
            };

            for (const nextActId of nextActIds) {
              let workflowStep;
              if (act.T === ActivityTypes.Conditional) {
                if (actResult) {
                  workflowStep = await workflowStepService.queryWorkflowStep({
                    AID: { eq: nextActId[1] },
                  });
                } else {
                  workflowStep = await workflowStepService.queryWorkflowStep({
                    AID: { eq: nextActId[0] },
                  });
                }
              } else {
                logger.log('Next Activity ID: ', nextActId);
                workflowStep = await workflowStepService.queryWorkflowStep({
                  AID: { eq: nextActId },
                });
              }

              let source = 'workflow.initiate';
              workflowStep = workflowStep[0];
              logger.log(workflowStep);

              logger.log('Saving workflow execution');
              let STE = { ...state };
              if (actResult && typeof actResult === 'object') {
                STE = { ...state, ...(actResult as any) };
              }
              await workflowExecutionService.saveWorkflowExecution(wfExec.WXID, {
                STE: JSON.stringify(STE),
                WSID: workflowStep.WSID,
                CAT: workflowStep.ACT,
              });
              logger.log('Successfully saved workflow execution');

              if (act.T === ActivityTypes.AssignData) {
                workflowStep.data = actResult;
              }
              if (act.T === ActivityTypes.Delay) {
                source = actResult as string;
              }
              params.Entries.push({
                Detail: JSON.stringify(workflowStep),
                DetailType: `workflowStep`,
                Source: source,
              });
            }

            logger.log(params);
            if (act.T === ActivityTypes.ManualInput && !act.MD.Completed) {
              logger.log('Waiting for Manual Input');
            } else if (act.T === ActivityTypes.Delay) {
              setTimeout(async () => {
                await putEventsEB(params);
              }, actResult as number);
            } else if (act.T === ActivityTypes.ParallelEnd) {
              if (wfExec.finishedParallelCount === wfExec.totalParallelCount && wfExec.isParallel) {
                await workflowExecutionService.saveWorkflowExecution(wfExec.WXID, {
                  isParallel: false,
                });
                await putEventsEB(params);
              } else {
                logger.log('Parallel tasks are not yet finished!');
              }
            } else {
              await putEventsEB(params);
            }
          }
        }
      } catch (err) {
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
