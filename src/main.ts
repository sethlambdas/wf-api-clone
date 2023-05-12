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
import { setUpSalesForce } from './initialSetup/salesforce.setup';
import { setUpAmadeus } from './initialSetup/amadeus.setup';
import { setupAdyen } from './initialSetup/adyen.setup';
import { setUpAerisWeather } from './initialSetup/aerisweather.setup';
import { setUpAirtable } from './initialSetup/airtable.setup';
import { setupBigCommerce } from './initialSetup/bigcommerce.setup';
import { setupBitly } from './initialSetup/bitly.setup';
import { setUpFacebook } from './initialSetup/facebook.setup';
import { setUpFirebase } from './initialSetup/firebase.setup';
import { setUpMailChimp } from './initialSetup/mailchimp.setup';
import { setupMailgun } from './initialSetup/mailgun.setup';
import { setupMicrosoftDynamics } from './initialSetup/microsoftdynamics.setup';
import { setupNotion } from './initialSetup/notion.setup';
import { setupPdf } from './initialSetup/pdf.setup';
import { setupSendgrid } from './initialSetup/sendgrid.setup';
import { setupSendle } from './initialSetup/sendle.setup';
import { setupShort } from './initialSetup/short.setup';
import { setupTrello } from './initialSetup/trello.setup';
import { setupTwilio } from './initialSetup/twilio.setup';
import { setupTypeForm } from './initialSetup/typeform.setup';
import { setUpYHFinance } from './initialSetup/yhfinance.setup';
import { setUpAWSSignature } from 'initialSetup/aws.setup';
import { setUpMicrosoftAzure } from 'initialSetup/azure.setup';

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
  await setUpAWSSignature(app);
  // await setupDocuware(app);
  await setUpMicrosoftAzure(app);
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
  await setUpSalesForce(app);
  await setUpAmadeus(app);
  await setupAdyen(app);
  await setUpAerisWeather(app);
  await setUpAirtable(app);
  await setupBigCommerce(app);
  await setupBitly(app);
  await setUpFacebook(app);
  await setUpFirebase(app);
  await setUpMailChimp(app);
  await setupMailgun(app);
  await setupMicrosoftDynamics(app);
  await setupNotion(app);
  await setupPdf(app);
  await setupSendgrid(app);
  await setupSendle(app);
  await setupShort(app);
  await setupTrello(app);
  await setupTwilio(app);
  await setupTypeForm(app);
  await setUpYHFinance(app);

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
