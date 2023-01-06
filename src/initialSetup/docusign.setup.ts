import { INestApplication, Logger } from '@nestjs/common';

import { AuthType } from '../graphql/common/enums/authentication.enum';
import { CreateIntegrationAppInput } from '../graphql/integration-app/inputs/create-integration-app.inputs';

import { IntegrationAppService } from '../graphql/integration-app/integration-app.service';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../graphql/integration-app/integration-app.enum';

const logger = new Logger('Docusign');

export async function setupDocusign(app: INestApplication) {
  logger.log('running initial Docusign setup');

  const integrationAppService = app.get(IntegrationAppService);

  const createIntegrationAppInput: CreateIntegrationAppInput = {
    name: 'Docusign',
    type: AuthType.OAUTH,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption.HEADERS,
    version: 1,
    urls: {
      authorize: 'https://account-d.docusign.com/oauth/auth',
      token: 'https://account-d.docusign.com/oauth/token',
      refreshToken: 'https://account-d.docusign.com/oauth/token',
    },
    scopes: [
      'impersonation',
      'extended',
      'signature',
      'openid',
      'click.manage',
      'click.send',
      'organization_read',
      'group_read',
      'permission_read',
      'user_read',
      'user_write',
      'account_read',
      'domain_read',
      'identity_provider_read',
      'datafeeds',
      'dtr.rooms.read',
      'dtr.rooms.write',
      'dtr.documents.read',
      'dtr.documents.write',
      'dtr.profile.read',
      'dtr.profile.write',
      'dtr.company.read',
      'dtr.company.write',
      'room_forms',
      'notary_write',
      'notary_read',
    ],
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
    fileUploadType: FileUploadType.DIRECT_BODY,
  };

  await integrationAppService.createIntegrationApp(createIntegrationAppInput);

  logger.log('Docusign setup - successful');

  return { success: true };
}
