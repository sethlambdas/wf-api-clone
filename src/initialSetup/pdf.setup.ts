import { INestApplication, Logger } from '@nestjs/common';
import { ClientService } from '../graphql/client/client.service';
import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';

const logger = new Logger('SetupPdf');

export async function setupPdf(app: INestApplication) {
  logger.log('running initial pdf setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Pdf',
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
        fieldName: 'x-api-key',
        fieldValue: '{{secret}}',
      },
    ],
  };

  const integrationApp = await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  const createClientInput: CreateClientInput = {
    appClient: 'WORKFLOW-APP',
    orgId: 'ORG#1234',
    name: 'LambdasPdf',
    type: AuthType.BASIC,
    status: ClientStatus.ACTIVE,
    fileUploadType: FileUploadType.DIRECT_BODY,
    intAppId: integrationApp.PK,
    integrationType: 'Pdf',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'x-api-key',
        fieldValue: '{{secret}}',
      },
    ],
    secrets: {
      apiKey: 'seth@lambdas.io_cdf441e4130435be40ae1272fadb8278f3c45030f4e9a3eeb6322ed180b2e1008fb2912a',
      rootUrl: 'https://api.pdf.co/v1/',
    },
  };

  const client = await clientService.createClient(createClientInput);

  logger.log('pdf setup - successful');

  return { success: true };
}
