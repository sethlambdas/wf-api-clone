import { INestApplication, Logger } from '@nestjs/common';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';

import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { ClientService } from '../graphql/client/client.service';
import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ConfigUtil } from '@lambdascrew/utility';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from 'graphql/integration-app/integration-app.enum';

const logger = new Logger('SetupTwilio');

export async function setupTwilio(app: INestApplication) {
  logger.log('running initial twilio setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Twilio',
    type: AuthType.BASIC,
    fileUploadType: FileUploadType.DIRECT_BODY,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    version: 1,
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
    ],
  };

  const integrationApp = await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  const createClientInput: CreateClientInput = {
    appClient: 'WORKFLOW-APP',
    orgId: 'ORG#1234',
    name: 'LambdasTwilio',
    type: AuthType.BASIC,
    status: ClientStatus.ACTIVE,
    fileUploadType: FileUploadType.DIRECT_BODY,
    intAppId: integrationApp.PK,
    integrationType: 'Twilio',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'Authorization',
        fieldValue: 'Basic {{accessToken}}',
      },
    ],
    secrets: {
      apiKey: '42eb00e2a43ea7702263e9e72e8b357d',
      rootUrl: `https://api.twilio.com/2010-04-01/Accounts/${ConfigUtil.get('integrations.twilio.sid')}/`,
    },
  };

  const client = await clientService.createClient(createClientInput);

  logger.log('twilio setup - successful');

  return { success: true };
}
