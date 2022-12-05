import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as AWS from 'aws-sdk';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';

import { ConfigUtil } from '@lambdascrew/utility';

import { AppModule } from './graphql/app.module';
import { WorkflowExecutionService } from './graphql/workflow-executions/workflow-execution.service';
import { WorkflowStepExecutionHistoryService } from './graphql/workflow-steps-executions-history/workflow-steps-wxh.service';
import { WorkflowStepService } from './graphql/workflow-steps/workflow-step.service';
import { WorkflowVersionService } from './graphql/workflow-versions/workflow-version.service';
import { WorkflowService } from './graphql/workflow/workflow.service';
import { OrganizationService } from './graphql/organizations/organization.service';
import localStackInit from './utils/helpers/localstack-init.util';
import Workflow from './workflow';
import { setupCin7 } from './initialSetup/cin7.setup';
import { setupDocuware } from './initialSetup/docuware.setup';
import { setupEntityCount } from './initialSetup/entity-count.setup';
import { setupKMS } from './initialSetup/kms.setup';
import { setupMYOB } from './initialSetup/myob.setup';
import { setupShopify } from './initialSetup/shopify.setup';
import { setupSlack } from './initialSetup/slack.setup';
import { setupStripe } from './initialSetup/stripe.setup';
import { setupXero } from './initialSetup/xero.setup';
import { setupZoho } from './initialSetup/zoho.setup';
import { setupGithub } from './initialSetup/github.setup';
import { setupDropbox } from './initialSetup/dropbox.setup';
import { setupGoogleDrive } from './initialSetup/googledrive.setup';
import { setupAdobesign } from './initialSetup/adobesign.setup';
import { setupDocusign } from './initialSetup/docusign.setup';
import { setupImgur } from './initialSetup/imgur.setup';
import { setupOnedrive } from './initialSetup/onedrive.setup';

AWS.config.update({ region: ConfigUtil.get('aws.region') });

async function bootstrap() {
  const logger = new Logger('bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ConfigUtil.get('logLevel'),
  });
  const organizationService = app.get(OrganizationService);
  const workflowService = app.get(WorkflowService);
  const workflowStepService = app.get(WorkflowStepService);
  const workflowExecutionService = app.get(WorkflowExecutionService);
  const workflowStepExecutionHistoryService = app.get(WorkflowStepExecutionHistoryService);
  const workflowVersionService = app.get(WorkflowVersionService);

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
  app.enableCors({
    credentials: true,
    origin,
  });
  logger.log(`Accepting requests from origin "${origin}"`);

  const port = ConfigUtil.get('server.port');
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);

  // Create Organization for Testing
  const organization = await organizationService.getOrganization({ PK: 'ORG#1234' });
  if (!organization) {
    await organizationService.createOrganization({ ORGNAME: 'TestOrgName', ORGID: '1234' });
  }

  logger.log(`Running Initial Setup`);

  if (process.env.NODE_ENV === 'development') {
    await setupKMS(app);
  }

  await setupEntityCount(app);
  await setupZoho(app);
  await setupDocuware(app);
  await setupCin7(app);
  await setupXero(app);
  await setupMYOB(app);
  await setupSlack(app);
  await setupShopify(app);
  await setupStripe(app);
  await setupGithub(app);
  await setupDropbox(app);
  await setupGoogleDrive(app);
  await setupAdobesign(app);
  await setupDocusign(app);
  await setupImgur(app);
  await setupOnedrive(app);

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
