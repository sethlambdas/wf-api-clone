import { INestApplication, Logger } from '@nestjs/common';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';

import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { ClientService } from '../graphql/client/client.service';
import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

const logger = new Logger('SetupMailgun');

export async function setupMailgun(app: INestApplication) {
  logger.log('running initial mailgun setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Mailgun',
    type: AuthType.BASIC,
    version: 1,
    fileUploadType: FileUploadType.DIRECT_BODY,
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'Authorization',
        fieldValue: 'Basic {{secret}}',
      },
    ],
  };

  const integrationApp = await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  const createClientInput: CreateClientInput = {
    appClient: 'WORKFLOW-APP',
    orgId: 'ORG#1234',
    name: 'LambdasMailgun',
    type: AuthType.BASIC,
    status: ClientStatus.ACTIVE,
    intAppId: integrationApp.PK,
    fileUploadType: FileUploadType.DIRECT_BODY,
    integrationType: 'Mailgun',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'Authorization',
        fieldValue: 'Basic {{secret}}',
      },
    ],
    secrets: {
      username: 'api',
      password: '3d175827f7423421214e379266691bd7-4c2b2223-52e7691f',
      rootUrl: 'https://api.mailgun.net/',
    },
  };

  const client = await clientService.createClient(createClientInput);

  logger.log('mailgun setup - successful');

  return { success: true };
}
