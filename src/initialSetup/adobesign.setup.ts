import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';
import { ClientAuthMethodEnums } from '../graphql/common/enums/oauth.enum';

const logger = new Logger('Adobesign');

export async function setupAdobesign(app: INestApplication) {
  logger.log('running initial Adobesign setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Adobesign',
    type: AuthType.OAUTH,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    version: 1,
    urls: {
      authorize: 'https://secure.au1.adobesign.com/public/oauth/v2',
      token: 'https://api.na1.adobesign.com/oauth/v2/token',
      refreshToken: 'https://api.na1.adobesign.com/oauth/v2/refresh',
    },
    additionalConfiguration: [
      { fieldName: 'response_type', fieldValue: 'code' }
    ],
    authMethod: ClientAuthMethodEnums.client_secret_post,
    scopes: [
      'user_read:account',
      'user_write:account',
      'user_login:account',
      'agreement_read:account',
      'agreement_write:account',
      'agreement_send:account',
      'widget_read:account',
      'widget_write:account',
      'library_read:account',
      'library_write:account',
      'workflow_read:account',
      'workflow_write:account',
    ],
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

  logger.log('Adobesign setup - successful');

  return { success: true };
}
