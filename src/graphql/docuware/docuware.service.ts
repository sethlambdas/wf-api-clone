import { Injectable } from '@nestjs/common';
import got from 'got';

import { AuthType } from '@graphql:common/enums/authentication.enum';
import { CreateClientInput } from 'graphql/client/inputs/create-client.input';
import { ClientService } from '../client/client.service';
import { IntegrationAppService } from '../integration-app/integration-app.service';
import { DocuwareClient } from './docuware.entity';
import { CreateDocuwareClientInput } from './inputs/create-docuware-client.input';
import { LoginDocuwareInput } from './inputs/login-docuware.input';

@Injectable()
export class DocuwareService {
  constructor(private clientService: ClientService, private integrationAppService: IntegrationAppService) {}

  getDocuwareConfig(rootUrl: string) {
    const docuwareConfig = {
      prefixUrl: rootUrl,
      timeout: 120000,
      headers: {
        Accept: 'application/json',
      },
      withCredentials: true,
      maxRedirects: 5,
    };
    return docuwareConfig;
  }

  getLoginConfig(config: LoginDocuwareInput) {
    const loginConfig = {
      Username: config.username,
      Password: config.password,
      Organization: config.organisation,
      HostID: config.hostId,
      RedirectToMyselfInCaseOfError: false,
      RememberMe: true,
    };
    return loginConfig;
  }

  async login(loginDocuwareInput: LoginDocuwareInput) {
    const response = await got.post('DocuWare/Platform/Account/Logon', {
      ...this.getDocuwareConfig(loginDocuwareInput.rootUrl),
      form: this.getLoginConfig(loginDocuwareInput),
    });
    const headers = response?.headers;
    return headers && headers['set-cookie'];
  }

  async createDocuwareClient(createDocuwareClientInput: CreateDocuwareClientInput): Promise<DocuwareClient> {
    const { secrets } = createDocuwareClientInput;

    const result = await this.login({
      hostId: secrets.hostId,
      organisation: secrets.organisation,
      username: secrets.username,
      password: secrets.password,
      rootUrl: secrets.rootUrl,
    });

    const integrationApp = await this.integrationAppService.findIntegrationAppByPK({
      PK: createDocuwareClientInput.intAppId,
      SK: `${createDocuwareClientInput.intAppId}||metadata`,
    });

    const cookieAuth = result?.filter((cookieString: string) => {
      return cookieString.indexOf(integrationApp.cookieName) > -1;
    });

    createDocuwareClientInput.secrets.cookie = JSON.stringify(cookieAuth);

    const client = await this.clientService.createClient(createDocuwareClientInput);

    if (!client) return null;

    return secrets;
  }
}
