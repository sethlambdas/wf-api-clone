import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

const logger = new Logger('Dropbox');

export async function setupDropbox(app: INestApplication) {
  logger.log('running initial Dropbox setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Dropbox',
    type: AuthType.OAUTH,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    version: 1,
    urls: {
      authorize: 'https://www.dropbox.com/oauth2/authorize',
      token: 'https://api.dropboxapi.com/oauth2/token',
    },
    additionalConfiguration: [
      { fieldName: 'response_type', fieldValue: 'code' }
    ],
    scopes: [
      'files.metadata.read',
      'files.metadata.write',
      'account_info.write',
      'files.content.write',
      'files.content.read',
      'sharing.write',
      'file_requests.write',
      'contacts.write',
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
    fileUploadType: FileUploadType.DIRECT_BODY
  };

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('Dropbox setup - successful');

  return { success: true };
}
