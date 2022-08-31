import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '@graphql:common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { FileUploadType } from '../graphql/integration-app/integration-app.enum';

const logger = new Logger('OneDrive');

export async function setupOnedrive(app: INestApplication) {
  logger.log('running initial OneDrive setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Imgur',
    type: AuthType.OAUTH,
    version: 1,
    urls: {
      authorize: 'https://login.live.com/oauth20_authorize.srf',
      token: 'https://login.live.com/oauth20_token.srf',
      refreshToken: 'https://login.live.com/oauth20_token.srf',
    },
    scopes: ['offline_access', 'onedrive.readonly', 'onedrive.readwrite', 'onedrive.appfolder'],
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
    fileUploadType: FileUploadType.DIRECT_BODY,
  };

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('OneDrive setup - successful');

  return { success: true };
}
