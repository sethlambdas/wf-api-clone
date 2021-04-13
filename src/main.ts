import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as AWS from 'aws-sdk';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { Consumer } from 'sqs-consumer';
import { AppModule } from './graphql/app.module';
import { WorkflowSpecService } from './graphql/workflow-specs/workflow-spec.service';
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
  const workflowSpecService = app.get(WorkflowSpecService);

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
          if (activityRegistry[act?.T]) {
            const actResult = await activityRegistry[act?.T].processActivity(act?.MD);
            logger.log(actResult);

            const params = {
              Entries: [],
            };

            const nextActIds = JSON.parse(msgPayload.detail.NAID);
            for (const nextActId of nextActIds) {
              let workflowSpec;
              if (act.T === ActivityTypes.Conditional) {
                if (actResult) {
                  workflowSpec = await workflowSpecService.getWorkflowSpec(nextActId[1]);
                } else {
                  workflowSpec = await workflowSpecService.getWorkflowSpec(nextActId[0]);
                }
              } else {
                workflowSpec = await workflowSpecService.getWorkflowSpec(nextActId);
              }

              let source = 'workflow.initiate';
              const wfSpecAct = JSON.parse(workflowSpec.ACT);

              if (act.T === ActivityTypes.AssignData) {
                wfSpecAct.data = actResult;
              }
              if (act.T === ActivityTypes.Delay) {
                source = actResult as string;
              }
              params.Entries.push({
                Detail: JSON.stringify(wfSpecAct),
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
  // const workflowSpec = await workflowSpecService.getWorkflowSpec("8ef99307-fe78-4aca-b5ff-374c50432592");
  // const params = {
  //   Entries: [
  //     {
  //       Detail: JSON.stringify(workflowSpec),
  //       DetailType: `workflowStep`,
  //       Source: 'workflow.initiate',
  //     },
  //   ],
  // };

  // await putEventsEB(params);
}

bootstrap();
