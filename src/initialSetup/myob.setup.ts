import { INestApplication, Logger } from '@nestjs/common';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';

const logger = new Logger('SetupMYOB');

export async function setupMYOB(app: INestApplication) {
  logger.log('running initial myob setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'MYOB',
    type: AuthType.OAUTH,
    fileUploadType: FileUploadType.DIRECT_BODY,
    version: 1,
    urls: {
      authorize: 'https://secure.myob.com/oauth2/account/authorize',
      token: 'https://secure.myob.com/oauth2/v1/authorize',
      refreshToken: 'https://secure.myob.com/oauth2/v1/authorize',
    },
    scopes: ['CompanyFile'],
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'Authorization',
        fieldValue: 'Bearer {{secret}}',
      },
      {
        fieldName: 'x-myobapi-key',
        fieldValue: '{{clientId}}',
      },
    ],
  };

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('myob setup - successful');

  return { success: true };
}
