import { INestApplication, Logger } from '@nestjs/common';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';

import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { ClientService } from '../graphql/client/client.service';
import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

const logger = new Logger('SetupMailChimp');

export async function setUpMailChimp(app: INestApplication) {
  logger.log('running initial mailchimp setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'MailChimp',
    type: AuthType.BASIC,
    fileUploadType: FileUploadType.DIRECT_BODY,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.BODY,
    version: 1,
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
    name: 'LambdasMailChimp',
    type: AuthType.BASIC,
    status: ClientStatus.ACTIVE,
    fileUploadType: FileUploadType.DIRECT_BODY,
    intAppId: integrationApp.PK,
    integrationType: 'Adyen',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
    ],
    secrets: {
      apiKey: 'md-Xa7r1kVFZMGr3p4mv2zvbg',
      rootUrl: 'https://mandrillapp.com/api/1.0/users/ping',
    },
  };

  const client = await clientService.createClient(createClientInput);

  logger.log('mailchimp setup - successful');

  return { success: true };
}
