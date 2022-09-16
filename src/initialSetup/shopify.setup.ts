import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';

const logger = new Logger('SetupShopify');

export async function setupShopify(app: INestApplication) {
  logger.log('running initial shopify setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Shopify',
    type: AuthType.OAUTH,
    version: 1,
    urls: {
      authorize: 'https://{{store}}.myshopify.com/admin/oauth/authorize',
      token: 'https://{{store}}.myshopify.com/admin/oauth/access_token',
    },
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
      {
        fieldName: 'X-Shopify-Access-Token',
        fieldValue: '{{accessToken}}',
      },
    ],
  };

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('shopify setup - successful');

  return { success: true };
}
