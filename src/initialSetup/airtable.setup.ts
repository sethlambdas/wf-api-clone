import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';
import { ClientAuthMethodEnums, GrantTypeEnums } from '../graphql/common/enums/oauth.enum';

const logger = new Logger('SetupAirtable');

export async function setUpAirtable(app: INestApplication) {
  logger.log('running initial airtable setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Airtable',
    type: AuthType.OAUTH,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    fileUploadType: FileUploadType.DIRECT_BODY,
    version: 1,
    authMethod: ClientAuthMethodEnums.client_secret_basic,
    grantType: GrantTypeEnums.AUTHORIZATION_CODE_WITH_PKCE,
    additionalConfiguration: [
      { fieldName: 'response_type', fieldValue: 'code' }
    ],
    urls: {
      authorize: 'https://airtable.com/oauth2/v1/authorize',
      token: 'https://airtable.com/oauth2/v1/token',
    },
    scopes: ['data.records:read'],
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

  logger.log('airtable setup - successful');

  return { success: true };
}
