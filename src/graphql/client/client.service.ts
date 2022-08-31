import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';

// import { CompositePrimaryKey } from '@graphql:common/interfaces/dynamodb-keys.interface';
import { cipherCMS, KMSType } from '../../utils/kms.util';
import { CompositePrimaryKey } from '@graphql:common/interfaces/dynamodb-keys.interface';
import { IntegrationAppService } from '../integration-app/integration-app.service';
// import { IntegrationAppService } from '../integration-app/integration-app.service';
import { Client } from './client.entity';
import { ClientRepository } from './client.repository';
import { CreateClientInput, SecretsInput } from './inputs/create-client.input';
import { FindClientByNameInput, FindClientByPkInput, ListClientsInput } from './inputs/find-client.input';

@Injectable()
export class ClientService {
  constructor(
    @Inject(ClientRepository)
    private clientRepository: ClientRepository,
    private integrationAppService: IntegrationAppService,
  ) {}

  async createClient(createClientInput: CreateClientInput): Promise<Client | null> {
    const { appClient, orgId, name, type, intAppId, status, headers, secrets, scopes, metadata, integrationType } =
      createClientInput;

    if (!orgId.includes('#')) return null;

    const pk = appClient.trim() + '||' + orgId;
    const sk = 'CLIENT' + '||' + integrationType.trim() + '||' + name.trim() + '||' + v4();

    const client: Client = {
      PK: pk,
      SK: sk,
      name,
      type,
      status,
      headers,
      intAppId,
      secrets,
    };

    if (scopes) client.scopes = scopes.split(',');
    if (metadata) client.metadata = metadata;

    const checkExistingRecords = await this.findClientByName({
      appClient,
      orgId,
      integrationName: integrationType,
      clientName: name,
    });

    if (checkExistingRecords) {
      delete client?.PK;
      delete client?.SK;
      const updatedResult = await this.saveClient(
        {
          PK: checkExistingRecords.PK,
          SK: checkExistingRecords.SK,
        },
        client,
      );
      return updatedResult;
    }

    if (secrets) client.secrets = await this.cipherClient(KMSType.ENCRYPT, secrets);

    const result = await this.clientRepository.createClient(client);

    return result;
  }

  async saveClient(key: CompositePrimaryKey, client: Partial<Client>) {
    const { secrets } = client;

    if (secrets) {
      client.secrets = await this.cipherClient(KMSType.ENCRYPT, secrets);
    }

    return this.clientRepository.saveClient(key, client);
  }

  async cipherClient(type: KMSType, secrets: Partial<SecretsInput>) {
    let secretsData = secrets;

    if (secretsData) {
      secretsData = await cipherCMS(type, secretsData);
    }

    return secretsData;
  }

  async findClientByPK(findClientByPkInput: FindClientByPkInput): Promise<Client | null> {
    const client = await this.clientRepository.findClientByPK(findClientByPkInput);

    if (client) {
      const { secrets } = client;
      if (secrets) {
        client.secrets = await this.cipherClient(KMSType.DECRYPT, secrets);
      }
      return client;
    }

    return null;
  }

  async findClientByName(findClientByNameInput: FindClientByNameInput): Promise<Client | null> {
    const result = await this.clientRepository.findClientByName(findClientByNameInput);

    if (result.length > 0) {
      const client = result[0];
      const { secrets } = client;
      if (secrets) {
        client.secrets = await this.cipherClient(KMSType.DECRYPT, secrets);
      }
      return client;
    }

    return null;
  }

  async listClient(listClientsInput: ListClientsInput): Promise<Client[]> {
    const clients = await this.clientRepository.listClient(listClientsInput);

    return clients;
  }

  // for testing in jest use only!!!!
  async scanClientRecords() {
    return this.clientRepository.scanClientRecords();
  }

  async deleteClientRecords(primaryKey: CompositePrimaryKey) {
    await this.clientRepository.deleteClientRecords(primaryKey);
  }
}
