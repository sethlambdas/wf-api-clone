import { INestApplication, Logger } from '@nestjs/common';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';
import { CreateClientInput } from 'graphql/client/inputs/create-client.input';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { ClientService } from '../graphql/client/client.service';
import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';

const logger = new Logger('SetupStripe');

export async function setupStripe(app: INestApplication) {
  logger.log('running initial stripe setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Stripe',
    type: AuthType.BASIC,
    version: 1,
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/x-www-form-urlencoded',
      },
    ],
  };

  const integrationApp = await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  const createClientInput: CreateClientInput = {
    appClient: 'WORKFLOW-APP',
    orgId: 'ORG#1234',
    name: 'LambdasStripe',
    type: AuthType.BASIC,
    status: ClientStatus.ACTIVE,
    intAppId: integrationApp.PK,
    integrationType: 'Stripe',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/x-www-form-urlencoded',
      },
      {
        fieldName: 'Authorization',
        fieldValue: 'Bearer {{accessToken}}',
      },
    ],
    secrets: {
      username:
        'sk_test_51JqpNlGQEob2OeE1ObmmPzIGmB0PNg9EjJGX1TfT82rHdJjyo4VBLKKuxiGZzt9iQDqtjpYLhTL2y9COAq8NKPMT00Ei9Eze0T',
      rootUrl: 'https://api.stripe.com/v1/',
    },
  };

  const client = await clientService.createClient(createClientInput);

  logger.log('stripe setup - successful');

  return { success: true };
}
