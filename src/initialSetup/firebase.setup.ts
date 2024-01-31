import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

const logger = new Logger('SetupFirebase');

export async function setUpFirebase(app: INestApplication) {
  logger.log('running initial firebase setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Firebase',
    type: AuthType.OAUTH,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    fileUploadType: FileUploadType.DIRECT_BODY,
    version: 1,
    urls: {
      authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
      token: 'https://oauth2.googleapis.com/token',
    },
    scopes: ['https://www.googleapis.com/auth/firebase'],
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

  logger.log('firebase setup - successful');

  return { success: true };
}
