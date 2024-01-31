import { INestApplication, Logger } from '@nestjs/common';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';

import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { ClientTokenService } from '../graphql/client-token/client-token.service';
import { CreateClientTokenInput } from '../graphql/client-token/inputs/create-client-token.inputs';
import { ClientService } from '../graphql/client/client.service';
import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

const logger = new Logger('SetupZoho');

export async function setupZoho(app: INestApplication) {
  logger.log('running initial zoho setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);
  const clientTokenService = app.get(ClientTokenService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Zoho',
    type: AuthType.OAUTH,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    fileUploadType: FileUploadType.DIRECT_BODY,
    version: 1,
    urls: {
      authorize: 'https://accounts.zoho.com/oauth/v2/auth',
      token: 'https://accounts.zoho.com/oauth/v2/token',
      refreshToken: 'https://accounts.zoho.com/oauth/v2/token',
    },
    scopes: ['ZohoCRM.modules.ALL'],
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

  const integrationApp = await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  const createClientInput: CreateClientInput = {
    appClient: 'WORKFLOW-APP',
    orgId: 'ORG#1234',
    name: 'LambdasZoho',
    type: AuthType.OAUTH,
    fileUploadType: FileUploadType.DIRECT_BODY,
    status: ClientStatus.ACTIVE,
    intAppId: integrationApp.PK,
    integrationType: 'Zoho',
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
    secrets: {
      clientId: '1000.QOSZ84GOWTSWJRHRGH0FMRYK0I19DL',
      clientSecret: '1bf587992a072e4ce7c42d0aa486f1cfbb7645b0e7',
      rootUrl: 'https://www.zohoapis.com/crm/v2/',
    },
  };

  const client = await clientService.createClient(createClientInput);

  const createClientTokenInput: CreateClientTokenInput = {
    PK: client.SK,
    accessToken: 'toBeModified',
    refreshToken: '1000.594dafc8dca3f1f1d6a5ee559267acb9.1b547fa05f06753145eb6e0cd3cbe4f5',
    expTime: 3600,
    clientPK: 'WORKFLOW-APP||ORG#1234',
  };

  await clientTokenService.createClientToken(createClientTokenInput);

  logger.log('zoho setup - successful');

  return { success: true };
}
