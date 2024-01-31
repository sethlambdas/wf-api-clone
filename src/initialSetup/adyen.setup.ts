import { INestApplication, Logger } from '@nestjs/common';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';

import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { ClientService } from '../graphql/client/client.service';
import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

const logger = new Logger('SetupAdyen');

export async function setupAdyen(app: INestApplication) {
  logger.log('running initial adyen setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Adyen',
    type: AuthType.BASIC,
    fileUploadType: FileUploadType.DIRECT_BODY,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
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
    name: 'LambdasAdyen',
    type: AuthType.BASIC,
    status: ClientStatus.ACTIVE,
    fileUploadType: FileUploadType.DIRECT_BODY,
    intAppId: integrationApp.PK,
    integrationType: 'Adyen',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'X-API-Key',
        fieldValue: '{{secret}}',
      },
    ],
    secrets: {
      apiKey: 'AQEshmfxLo3NYxdLw0m/n3Q5qf3VZIpAD5dLSzEEl3U8AzhFuHl6u7FLCZkVonAQwV1bDb7kfNy1WIxIIkxgBw==-0xAe5+PVwH/Q6u+lx+9/9Kb1NPz6K8vlCaGzQMXXxlI=-N{,g5w4]$(%g:,4]',
      rootUrl: 'https://checkout-test.adyen.com',
    },
  };

  const client = await clientService.createClient(createClientInput);

  logger.log('adyen setup - successful');

  return { success: true };
}
