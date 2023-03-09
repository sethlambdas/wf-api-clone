import { INestApplication, Logger } from '@nestjs/common';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';

import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { ClientService } from '../graphql/client/client.service';
import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ConfigUtil } from '@lambdascrew/utility';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

const logger = new Logger('SetupSendle');

export async function setupSendle(app: INestApplication) {
  logger.log('running initial sendle setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Sendle',
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
        fieldName: 'Accept',
        fieldValue: 'application/json',
      },
    ],
  };

  const integrationApp = await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  const createClientInput: CreateClientInput = {
    appClient: 'WORKFLOW-APP',
    orgId: 'ORG#1234',
    name: 'LambdasSendle',
    type: AuthType.BASIC,
    status: ClientStatus.ACTIVE,
    intAppId: integrationApp.PK,
    fileUploadType: FileUploadType.DIRECT_BODY,
    integrationType: 'Sendle',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
    ],
    secrets: {
      apiKey: 'sandbox_tVXmzStvRsn38xHfZ8mTnzDr',
      rootUrl: `https://${ConfigUtil.get('integrations.sendle.url')}.sendle.com/api/`,
    },
  };

  const client = await clientService.createClient(createClientInput);

  logger.log('sendle setup - successful');

  return { success: true };
}
