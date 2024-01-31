import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

const logger = new Logger('SetupGoogleDrive');

export async function setupGoogleDrive(app: INestApplication) {
  logger.log('running initial googledrive setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'GoogleDrive',
    type: AuthType.OAUTH,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    version: 1,
    urls: {
      authorize: 'https://accounts.google.com/o/oauth2/auth',
      token: 'https://oauth2.googleapis.com/token',
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
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
    fileUploadType: FileUploadType.MULTIPART_RELATED
  };

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('googledrive setup - successful');

  return { success: true };
}
