import { INestApplication, Logger } from '@nestjs/common';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientAuthMethodEnums, GrantTypeEnums } from '../graphql/common/enums/oauth.enum';

const logger = new Logger('SetupNotion');

export async function setupNotion(app: INestApplication) {
  logger.log('running initial notion setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Notion',
    type: AuthType.OAUTH,
    fileUploadType: FileUploadType.DIRECT_BODY,
    version: 1,
    additionalConfiguration: [
      { fieldName: 'response_type', fieldValue: 'code' }
    ],
    grantType: GrantTypeEnums.AUTHORIZATION_CODE,
    authMethod: ClientAuthMethodEnums.client_secret_basic,
    urls: {
      authorize: 'https://api.notion.com/v1/oauth/authorize',
      token: 'https://api.notion.com/v1/oauth/token',
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
  };

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('notion setup - successful');

  return { success: true };
}
