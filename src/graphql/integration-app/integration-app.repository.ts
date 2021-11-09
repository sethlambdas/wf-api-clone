import { Injectable } from '@nestjs/common';

import { ConfigUtil } from '@lambdascrew/utility';

import { HttpMethod, IGraphqlPayload, networkClient } from '../../utils/helpers/networkRequest.util';
import { ListIntegrationAppsInput } from './inputs/list-integration-app.input';
import { IListIntegrationApps, IntegrationApp } from './integration-app.entity';
import { LIST_INTEGRATION_APPS } from './integration-app.gql-queries';

const endpoint = ConfigUtil.get('authBeEndpoint') || 'http://localhost:3001/api/graphql';

@Injectable()
export class IntegrationAppRepository {
  async listIntegrationApps(listIntegrationAppsInput: ListIntegrationAppsInput): Promise<IntegrationApp[]> {
    const payload: IGraphqlPayload = {
      query: LIST_INTEGRATION_APPS,
      variables: { inputs: { ...listIntegrationAppsInput } },
    };

    const response = (await networkClient({
      method: HttpMethod.POST,
      url: endpoint,
      headers: {},
      queryParams: {},
      bodyParams: payload,
    })) as IListIntegrationApps;

    return response.data.ListIntegrationApps;
  }
}
