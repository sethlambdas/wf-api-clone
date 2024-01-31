import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

const logger = new Logger('SetupAerisWeather');

export async function setUpAerisWeather(app: INestApplication) {
  logger.log('running initial aerisweather setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'AerisWeather',
    type: AuthType.OAUTH,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.QUERY_PARAMS,
    fileUploadType: FileUploadType.DIRECT_BODY,
    version: 1,
    urls: {
      authorize: 'https://www.aerisweather.com/oauth/authorize',
      token: 'https://www.aerisweather.com/oauth/token',
    },
    scopes: [],
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

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('aerisweather setup - successful');

  return { success: true };
}
