import { INestApplication, Logger } from '@nestjs/common';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';
import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { ClientService } from '../graphql/client/client.service';

const logger = new Logger('SetupYHFinance');

export async function setUpYHFinance(app: INestApplication) {
  logger.log('running initial yh-finance setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'YH Finance',
    type: AuthType.BASIC,
    fileUploadType: FileUploadType.DIRECT_BODY,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    version: 1,
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
  };

  const integrationApp = await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  const createClientInput: CreateClientInput = {
    appClient: 'WORKFLOW-APP',
    orgId: 'ORG#1234',
    name: 'LambdasFinance',
    type: AuthType.BASIC,
    status: ClientStatus.ACTIVE,
    fileUploadType: FileUploadType.DIRECT_BODY,
    intAppId: integrationApp.PK,
    integrationType: 'YhFinance',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
    ],
    secrets: {
      apiKey: '4a5815580emsha00e263411b55e8p156ed7jsnf6dedce1a099',
      rootUrl: `https://yh-finance.p.rapidapi.com/market/v2/get-quotes`,
    },
  };

  const client = await clientService.createClient(createClientInput);

  return { success: true };
}
