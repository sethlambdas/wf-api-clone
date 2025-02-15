import { INestApplication, Logger } from '@nestjs/common';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientAuthMethodEnums } from '../graphql/common/enums/oauth.enum';

const logger = new Logger('SetupBigCommerce');

export async function setupBigCommerce(app: INestApplication) {
  logger.log('running initial BigCommerce setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'BigCommerce',
    type: AuthType.OAUTH,
    fileUploadType: FileUploadType.DIRECT_BODY,
    version: 1,
    urls: {
      authorize: 'https://login.bigcommerce.com/oauth2/authorize',
      token: 'https://login.bigcommerce.com/oauth2/token',
    },
    scopes: ['store_v2_content_read_only', 'store_v2_products'],
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
    additionalConfiguration: [
      { fieldName: 'response_type', fieldValue: 'code' },
      { fieldName: 'context', fieldValue: '' },
      { fieldName: 'account_uuid', fieldValue: '' }
    ],
    authMethod: ClientAuthMethodEnums.client_secret_post
  };

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('BigCommerce setup - successful');

  return { success: true };
}
