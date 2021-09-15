import { Injectable } from '@nestjs/common';
import { ConfigUtil } from '@lambdascrew/utility';

import { networkClient, HttpMethod, IGraphqlPayload } from '../../utils/networkRequest.util';
import { ListClientsInput } from './inputs/list-client.input';
import { LIST_CLIENTS } from './client.gql-queries';
import { Client, IListClients } from './client.entity';

const endpoint = ConfigUtil.get('authBeEndpoint') || 'http://localhost:3001/api/graphql';

@Injectable()
export class ClientRepository {
  constructor() {}

  async listClients(listClientsInput: ListClientsInput): Promise<Client[]> {
    const payload: IGraphqlPayload = {
      query: LIST_CLIENTS,
      variables: { inputs: { ...listClientsInput }}
    }

    const response = await networkClient({
      method: HttpMethod.POST,
      url: endpoint,
      headers: {},
      queryParams: {},
      bodyParams: payload
    }) as IListClients;

    return response.data.ListClients;
  }
}