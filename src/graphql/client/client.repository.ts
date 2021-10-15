import { ConfigUtil } from '@lambdascrew/utility';
import { Injectable } from '@nestjs/common';

import { HttpMethod, IGraphqlPayload, networkClient } from '../../utils/helpers/networkRequest.util';
import { Client, IListClients } from './client.entity';
import { LIST_CLIENTS } from './client.gql-queries';
import { ListClientsInput } from './inputs/list-client.input';

const endpoint = ConfigUtil.get('authBeEndpoint') || 'http://localhost:3001/api/graphql';

@Injectable()
export class ClientRepository {
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
