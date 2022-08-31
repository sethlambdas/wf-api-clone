import { ConfigUtil } from '@lambdascrew/utility';
import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { CompositePrimaryKey } from '@graphql:common/interfaces/dynamodb-keys.interface';

// import { CompositePrimaryKey } from '@graphql:common/interfaces/dynamodb-keys.interface';
import { Client } from './client.entity';
import { FindClientByNameInput, ListClientsInput } from './inputs/find-client.input';

@Injectable()
export class ClientRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.integrations'))
    private clientModel: Model<Client, CompositePrimaryKey>,
  ) {}

  async createClient(client: Client): Promise<Client> {
    const results = await this.clientModel.create(client);

    return results;
  }

  async saveClient(key: CompositePrimaryKey, client: Partial<Client>) {
    return this.clientModel.update(key, client);
  }

  async findClientByPK(primaryKey: CompositePrimaryKey): Promise<Client> {
    const results = await this.clientModel.get(primaryKey);

    return results;
  }

  async findClientByName(findClientByNameInput: FindClientByNameInput): Promise<Client[]> {
    const { appClient, orgId, integrationName, clientName } = findClientByNameInput;

    const PK = appClient.trim() + '||' + orgId;
    const sk = 'CLIENT' + '||' + integrationName.trim() + '||' + clientName.trim();

    const results = await this.clientModel.query({ PK }).and().where('SK').beginsWith(sk).exec();

    return results;
  }

  async listClient(listClientsInput: ListClientsInput): Promise<Client[]> {
    const { appClient, orgId, integrationName } = listClientsInput;

    const PK = appClient.trim() + '||' + orgId;
    const sk = 'CLIENT' + '||' + (integrationName ? integrationName : '');

    const results = await this.clientModel.query({ PK }).and().where('SK').beginsWith(sk).exec();

    return results;
  }

  // for testing in jest use only!!!!
  async scanClientRecords() {
    return this.clientModel.scan().exec();
  }

  async deleteClientRecords(primaryKey: CompositePrimaryKey) {
    await this.clientModel.delete(primaryKey);
  }
}
