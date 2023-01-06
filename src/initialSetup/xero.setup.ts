import { INestApplication, Logger } from '@nestjs/common';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';

import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { ClientTokenService } from '../graphql/client-token/client-token.service';
import { CreateClientTokenInput } from '../graphql/client-token/inputs/create-client-token.inputs';
import { ClientService } from '../graphql/client/client.service';
import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption } from 'graphql/integration-app/integration-app.enum';

const logger = new Logger('SetupXero');

export async function setupXero(app: INestApplication) {
  logger.log('running initial xero setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);
  const clientTokenService = app.get(ClientTokenService);
  const scopes =
    'offline_access openid profile email accounting.transactions accounting.budgets.read accounting.reports.read accounting.journals.read accounting.settings accounting.settings.read accounting.contacts accounting.contacts.read accounting.attachments accounting.attachments.read files files.read assets assets.read projects projects.read payroll.employees payroll.payruns payroll.payslip payroll.timesheets payroll.settings';

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Xero',
    type: AuthType.OAUTH,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    version: 1,
    urls: {
      authorize: 'https://login.xero.com/identity/connect/authorize',
      token: 'https://identity.xero.com/connect/token',
      refreshToken: 'https://identity.xero.com/connect/token',
    },
    scopes: scopes.split(' '),
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'Authorization',
        fieldValue: 'Bearer {{accessToken}}',
      },
    ],
  };

  const integrationApp = await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  const createClientInput: CreateClientInput = {
    appClient: 'WORKFLOW-APP',
    orgId: 'ORG#1234',
    name: 'LambdasXero',
    type: AuthType.OAUTH,
    status: ClientStatus.ACTIVE,
    intAppId: integrationApp.PK,
    integrationType: 'Xero',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'Authorization',
        fieldValue: 'Bearer {{accessToken}}',
      },
    ],
    secrets: {
      clientId: '48D2F62E0E594F75B197907E4ADEA39F',
      clientSecret: 'aD_pFqG0BngnIgueLsuftTNS8PUs8TKrJnLwRW5VEap0YH9V',
      rootUrl: 'https://api.xero.com/api.xro/2.0/',
    },
  };

  const client = await clientService.createClient(createClientInput);

  const createClientTokenInput: CreateClientTokenInput = {
    PK: client.SK,
    accessToken: 'toBeModified',
    refreshToken: '0e2a19f3132cfa23705515c45c151f83aff7c355d0f11dce72eaf4a898b7c859',
    expTime: 1800,
    clientPK: 'WORKFLOW-APP||ORG#1234',
  };

  await clientTokenService.createClientToken(createClientTokenInput);

  logger.log('xero setup - successful');

  return { success: true };
}
