import { INestApplication, Logger } from '@nestjs/common';
import { ClientService } from '../graphql/client/client.service';
import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';

const logger = new Logger('SetupSendgrid');

export async function setupSendgrid(app: INestApplication) {
  logger.log('running initial sendgrid setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Sendgrid',
    type: AuthType.BASIC,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    fileUploadType: FileUploadType.DIRECT_BODY,
    version: 1,
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'Authorization',
        fieldValue: 'Bearer {{accessToken}}',
      },
    ],
  };

  const integrationApp = await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  const createClientInput: CreateClientInput = {
    appClient: 'WORKFLOW-APP',
    orgId: 'ORG#1234',
    name: 'LambdasSendgrid',
    type: AuthType.BASIC,
    fileUploadType: FileUploadType.DIRECT_BODY,
    status: ClientStatus.ACTIVE,
    intAppId: integrationApp.PK,
    integrationType: 'Sendgrid',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'Authorization',
        fieldValue: 'Bearer {{accessToken}}',
      },
    ],
    secrets: {
      apiKey: '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',
      rootUrl: 'https://api.sendgrid.com/v3/',
    },
  };

  const client = await clientService.createClient(createClientInput);

  logger.log('sendgrid setup - successful');

  return { success: true };
}
