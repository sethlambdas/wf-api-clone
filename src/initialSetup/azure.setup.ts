import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

const logger = new Logger('SetupMicrosoftAzure');

export async function setUpMicrosoftAzure(app: INestApplication) {
  logger.log('running initial microsoft azure setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'MicrosoftAzure',
    type: AuthType.OAUTH,
    fileUploadType: FileUploadType.DIRECT_BODY,
    version: 1,
    urls: {
      authorize: 'https://login.microsoftonline.com/e2eda4f2-8a67-4651-9f41-922b309f283d/oauth2/v2.0/authorize',
      token: 'https://login.microsoftonline.com/e2eda4f2-8a67-4651-9f41-922b309f283d/oauth2/v2.0/token',
    },
    scopes: ['https://storage.azure.com/user_impersonation'],
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

  logger.log('microsoft azure setup - successful');

  return { success: true };
}
