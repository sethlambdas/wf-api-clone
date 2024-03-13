import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';
import { GrantTypeEnums } from '../graphql/common/enums/oauth.enum';

const logger = new Logger('SetupAmadeus');

export async function setUpAmadeus(app: INestApplication) {
  logger.log('running initial amadeus setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Amadeus',
    type: AuthType.OAUTH,
    fileUploadType: FileUploadType.DIRECT_BODY,
    grantType: GrantTypeEnums.CLIENT_CREDENTIALS,
    version: 1,
    urls: {
      authorize: 'https://test.api.amadeus.com/v1/security/oauth2/token',
      token: 'https://test.api.amadeus.com/v1/security/oauth2/token',
    },
    scopes: ['air:read', 'hotel:read', 'bus:read'],
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

  logger.log('salesforce setup - successful');

  return { success: true };
}
