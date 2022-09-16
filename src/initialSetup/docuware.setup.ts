import { AuthType, ClientStatus } from '../graphql/common/enums/authentication.enum';
import { INestApplication, Logger } from '@nestjs/common';

import { ClientService } from '../graphql/client/client.service';
import { CreateClientInput } from '../graphql/client/inputs/create-client.input';
import { DocuwareService } from '../graphql/docuware/docuware.service';
import { LoginDocuwareInput } from '../graphql/docuware/inputs/login-docuware.input';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';
import { FileUploadType } from '../graphql/integration-app/integration-app.enum';
import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';

const logger = new Logger('SetupDocuware');

export async function setupDocuware(app: INestApplication) {
  logger.log('running initial docuware setup');

  const docuwareService = app.get(DocuwareService);
  const clientService = app.get(ClientService);
  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Docuware',
    type: AuthType.COOKIE,
    version: 1,
    cookieName: 'DWPLATFORMAUTH',
    headers: [
      {
        fieldName: 'Content-Type',
        fieldValue: 'application/json',
      },
    ],
    fileUploadType: FileUploadType.MULTIPART_FORMDATA
  };

  const integrationApp = await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  const createClientInput: CreateClientInput = {
    appClient: 'WORKFLOW-APP',
    orgId: 'ORG#1234',
    name: 'LambdasDocuware',
    type: AuthType.COOKIE,
    status: ClientStatus.ACTIVE,
    intAppId: integrationApp.PK,
    integrationType: 'Docuware',
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
      username: 'Nesh Mijailovic',
      password: 'ZISS_spuk7gars8sel',
      organisation: 'Coreform',
      hostId: '46b1c66e-9849-4493-a2c5-948f0a9e801c',
      rootUrl: 'https://coreform.docuware.cloud/',
      cookie: '',
    },
  };

  const { username, password, organisation, hostId, rootUrl } = createClientInput.secrets;

  const loginDocuwareInput: LoginDocuwareInput = {
    username,
    password,
    organisation,
    hostId,
    rootUrl,
  };

  const result = await docuwareService.login(loginDocuwareInput);
  const cookieAuth = result?.filter((cookieString: string) => {
    return cookieString.indexOf(createIntegrationAppInput.cookieName) > -1;
  });

  createClientInput.secrets = {
    ...createClientInput.secrets,
    cookie: JSON.stringify(cookieAuth),
  };

  const client = await clientService.createClient(createClientInput);

  logger.log('docuware setup - successful');

  return { success: true };
}
