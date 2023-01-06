import { INestApplication, Logger } from '@nestjs/common';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';

import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { ClientService } from '../graphql/client/client.service';
import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption } from 'graphql/integration-app/integration-app.enum';

const logger = new Logger('SetupSlack');

export async function setupSlack(app: INestApplication) {
  logger.log('running initial slack setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Slack',
    type: AuthType.OAUTH,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    version: 1,
    urls: {
      authorize: 'https://slack.com/oauth/v2/authorize',
      token: 'https://slack.com/api/oauth.v2.access',
      refreshToken: 'https://slack.com/api/oauth.v2.access',
    },
    scopes: [
      'chat:write',
      'channels:history',
      'channels:read',
      'groups:history',
      'groups:read',
      'im:history',
      'im:read',
      'mpim:history',
      'mpim:read',
    ],
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
    name: 'LambdasSlack',
    type: AuthType.OAUTH,
    status: ClientStatus.ACTIVE,
    intAppId: integrationApp.PK,
    integrationType: 'Slack',
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
      clientId: '2637578344721.2648700219248',
      clientSecret: 'a73bee465c4f2a2d2620b7483f9d9f4d',
      rootUrl: 'https://slack.com/api/',
    },
  };

  await clientService.createClient(createClientInput);

  logger.log('slack setup - successful');

  return { success: true };
}
