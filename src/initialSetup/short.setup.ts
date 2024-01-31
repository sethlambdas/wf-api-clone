import { INestApplication, Logger } from '@nestjs/common';
import { ClientService } from '../graphql/client/client.service';
import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';

const logger = new Logger('SetupShort');

export async function setupShort(app: INestApplication) {
  logger.log('running initial short setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Short',
    type: AuthType.BASIC,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    fileUploadType: FileUploadType.DIRECT_BODY,
    version: 1,
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'authorization',
        fieldValue: '{{secret}}',
      },
    ],
  };

  const integrationApp = await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  const createClientInput: CreateClientInput = {
    appClient: 'WORKFLOW-APP',
    orgId: 'ORG#1234',
    name: 'LambdasShort',
    type: AuthType.BASIC,
    status: ClientStatus.ACTIVE,
    fileUploadType: FileUploadType.DIRECT_BODY,
    intAppId: integrationApp.PK,
    integrationType: 'Short',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'authorization',
        fieldValue: '{{secret}}',
      },
    ],
    secrets: {
      apiKey: 'sk_fseqhThSArJ97tKQ',
      rootUrl: 'https://api.short.io/links',
    },
  };

  const client = await clientService.createClient(createClientInput);

  logger.log('short setup - successful');

  return { success: true };
}
