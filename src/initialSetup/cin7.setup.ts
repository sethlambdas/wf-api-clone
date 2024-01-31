import { INestApplication, Logger } from '@nestjs/common';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';

import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { ClientService } from '../graphql/client/client.service';
import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';

const logger = new Logger('SetupCin7');

export async function setupCin7(app: INestApplication) {
  logger.log('running initial cin7 setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Cin7',
    type: AuthType.BASIC,
    version: 1,
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
    ],
  };

  const integrationApp = await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  const createClientInput: CreateClientInput = {
    appClient: 'WORKFLOW-APP',
    orgId: 'ORG#1234',
    name: 'LambdasCin7',
    type: AuthType.BASIC,
    status: ClientStatus.ACTIVE,
    intAppId: integrationApp.PK,
    integrationType: 'Cin7',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'Authorization',
        fieldValue: 'Bearer {{secret}}',
      },
    ],
    secrets: {
      username: 'CoreformTestAU:d830b82915ad4a679135408840f469a0',
      rootUrl: 'https://api.cin7.com/api/v1/',
    },
  };

  const client = await clientService.createClient(createClientInput);

  logger.log('cin7 setup - successful');

  return { success: true };
}
