import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as AWS from 'aws-sdk';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './graphql/app.module';
import { OrganizationService } from './graphql/organizations/organization.service';
import { WorkflowExecutionService } from './graphql/workflow-executions/workflow-execution.service';
import { WorkflowStepExecutionHistoryService } from './graphql/workflow-steps-executions-history/workflow-steps-wxh.service';
import { WorkflowStepService } from './graphql/workflow-steps/workflow-step.service';
import { WorkflowVersionService } from './graphql/workflow-versions/workflow-version.service';
import { WorkflowService } from './graphql/workflow/workflow.service';
import { ConfigUtil } from './utils/config.util';
import localStackInit from './utils/localstack-init.util';
import Workflow from './workflow';

AWS.config.update({ region: ConfigUtil.get('aws.region') });

async function bootstrap() {
  const logger = new Logger('bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ConfigUtil.get('logLevel'),
  });
  const workflowService = app.get(WorkflowService);
  const workflowStepService = app.get(WorkflowStepService);
  const workflowExecutionService = app.get(WorkflowExecutionService);
  const workflowStepExecutionHistoryService = app.get(WorkflowStepExecutionHistoryService);
  const workflowVersionService = app.get(WorkflowVersionService);
  const organizationService = app.get(OrganizationService);

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

  // Create Organization for Testing
  const organization = await organizationService.getOrganization({ PK: 'ORG#1234' });
  if (!organization) {
    await organizationService.createOrganization({ orgName: 'TestOrgName', orgId: '1234' });
  }

  const workflow = new Workflow(
    logger,
    workflowService,
    workflowStepService,
    workflowExecutionService,
    workflowStepExecutionHistoryService,
    workflowVersionService,
  );
  await workflow.run();
  logger.log('Workflow has started running...');
}

bootstrap();
