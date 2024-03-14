import { INestApplication, Logger } from '@nestjs/common';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';

const logger = new Logger('SetupTrello');

export async function setupTrello(app: INestApplication) {
  logger.log('running initial Trello setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Trello',
    type: AuthType.OAUTH,
    fileUploadType: FileUploadType.DIRECT_BODY,
    version: 1,
    urls: {
      authorize: 'https://trello.com/1/authorize',
      token: 'https://trello.com/1/authorize',
    },
    scopes: ['read', 'write', 'account'],
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
      { fieldName: 'expiration', fieldValue: '1day' },
      { fieldName: 'name', fieldValue: '' },
      { fieldName: 'response_type', fieldValue: 'fragment' },
      { fieldName: 'key', fieldValue: '' },
      { fieldName: 'callback_method', fieldValue: 'fragment' }
    ]
  };

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('Trello setup - successful');

  return { success: true };
}
