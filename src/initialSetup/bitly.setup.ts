import { INestApplication, Logger } from '@nestjs/common';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientAuthMethodEnums } from '../graphql/common/enums/oauth.enum';

const logger = new Logger('SetupBitly');

export async function setupBitly(app: INestApplication) {
  logger.log('running initial Bitly setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Bitly',
    type: AuthType.OAUTH,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    fileUploadType: FileUploadType.DIRECT_BODY,
    authMethod: ClientAuthMethodEnums.client_secret_post,
    version: 1,
    urls: {
      authorize: 'https://bitly.com/oauth/authorize',
      token: 'https://api-ssl.bitly.com/oauth/access_token',
    },
    scopes: ['read', 'write', 'private', 'org'],
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

  logger.log('Bitly setup - successful');

  return { success: true };
}
