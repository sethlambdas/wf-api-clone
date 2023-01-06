import { INestApplication, Logger } from '@nestjs/common';
import { ClientIntegrationDetailsPlacementOption } from 'graphql/integration-app/integration-app.enum';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';

const logger = new Logger('SetupGithub');

export async function setupGithub(app: INestApplication) {
  logger.log('running initial github setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Github',
    type: AuthType.OAUTH,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    version: 1,
    urls: {
      authorize: 'https://github.com/login/oauth/authorize',
      token: 'https://github.com/login/oauth/access_token',
    },
    scopes: ['user', 'repo', 'notifications', 'gist'],
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'Authorization',
        fieldValue: 'token {{accessToken}}',
      },
    ],
  };

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('github setup - successful');

  return { success: true };
}
