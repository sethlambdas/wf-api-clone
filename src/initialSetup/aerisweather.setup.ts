import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { ApiKeyConfigurationEnum, FileUploadType } from '../graphql/integration-app/integration-app.enum';
import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';

const logger = new Logger('SetupAerisWeather');

export async function setUpAerisWeather(app: INestApplication) {
  logger.log('running initial aerisweather setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'AerisWeather',
    type: AuthType.API_KEY,
    fileUploadType: FileUploadType.DIRECT_BODY,
    addTo: ApiKeyConfigurationEnum.QUERY_PARAMS,
    apiKeyConfiguration: [
      { fieldName: 'client_id', fieldValue: '' },
      { fieldName: 'client_secret', fieldValue: '' }
    ],
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

    ],
  };

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('aerisweather setup - successful');

  return { success: true };
}
