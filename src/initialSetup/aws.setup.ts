import { INestApplication, Logger } from '@nestjs/common';

import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';

import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { ClientService } from '../graphql/client/client.service';
import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '@src:graphql/integration-app/integration-app.enum';

const logger = new Logger('setUpAWSSignature');

export async function setUpAWSSignature(app: INestApplication) {
  logger.log('running initial AWS Signature setup');

  const integrationAppService = app.get(IntegrationAppService);
  const clientService = app.get(ClientService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'AWS Signature',
    type: AuthType.AWSSignature,
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
    name: 'LambdasAWSSignature',
    type: AuthType.AWSSignature,
    status: ClientStatus.ACTIVE,
    fileUploadType: FileUploadType.DIRECT_BODY,
    intAppId: integrationApp.PK,
    integrationType: 'AWSSignature',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
    ],
    secrets: {
      accessKey: 'accesskey',
      secretKey: 'secretkey',
      rootUrl: 'https://s3.ap-southeast-2.amazonaws.com',
    },
  };

  const client = await clientService.createClient(createClientInput);

  logger.log('aws setup - successful');

  return { success: true };
}
