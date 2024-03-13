import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

const logger = new Logger('Imgur');

export async function setupImgur(app: INestApplication) {
  logger.log('running initial Imgur setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Imgur',
    type: AuthType.OAUTH,
    version: 1,
    urls: {
      authorize: 'https://api.imgur.com/oauth2/authorize',
      token: 'https://api.imgur.com/oauth2/token',
      refreshToken: 'https://api.imgur.com/oauth2/token',
    },
    scopes: [],
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
    fileUploadType: FileUploadType.DIRECT_BODY,
  };

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('Imgur setup - successful');

  return { success: true };
}
