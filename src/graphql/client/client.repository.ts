import { ConfigUtil } from '@lambdascrew/utility';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { CompositePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';

// import { CompositePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { Client, IListClients } from './client.entity';
import { FindClientByNameInput, ListClientsInput } from './inputs/find-client.input';
import { HttpMethod, IGraphqlPayload, networkClient } from '../../utils/helpers/networkRequest.util';
import { LIST_CLIENTS } from './client.gql-queries';
import { AuthType, ClientStatus } from '../common/enums/authentication.enum';

const endpoint = ConfigUtil.get('authBeEndpoint') || 'http://localhost:3001/api/graphql';
@Injectable()
export class ClientRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.integrations'))
    private clientModel: Model<Client, CompositePrimaryKey>,
  ) { }

  async createClient(client: Client): Promise<Client> {
    const results = await this.clientModel.create({
      PK: client.PK,
      SK: client.SK,
      name: client.name,
      type: client.type,
      status: client.status as ClientStatus || ClientStatus.ACTIVE,
      intAppId: client.intAppId,
      secrets: client.secrets,
      headers: client.headers,
      apiKeyConfigurations: client.apiKeyConfigurations
    });
   
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

  async listClients(listClientsInput: ListClientsInput): Promise<Client[]> {
    const payload: IGraphqlPayload = {
      query: LIST_CLIENTS,
      variables: { inputs: { ...listClientsInput } },
    };

    const response = (await networkClient({
      method: HttpMethod.POST,
      url: endpoint,
      headers: {},
      queryParams: {},
      bodyParams: payload,
    })) as IListClients;

    return response.data.ListClients;
  }
}
