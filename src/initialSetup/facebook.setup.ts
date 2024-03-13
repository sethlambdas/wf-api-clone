import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';
import { GrantTypeEnums } from '../graphql/common/enums/oauth.enum';

const logger = new Logger('SetupFacebook');

export async function setUpFacebook(app: INestApplication) {
  logger.log('running initial facebook setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Facebook',
    type: AuthType.OAUTH,
    fileUploadType: FileUploadType.DIRECT_BODY,
    grantType: GrantTypeEnums.CLIENT_CREDENTIALS,
    version: 1,
    urls: {
      authorize: 'https://graph.facebook.com/oauth/access_token',
      token: 'https://graph.facebook.com/oauth/access_token',
    },
    scopes: ['public_profile'],
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

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('facebook setup - successful');

  return { success: true };
}
