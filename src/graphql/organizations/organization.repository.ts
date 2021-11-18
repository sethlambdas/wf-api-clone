import { Injectable } from '@nestjs/common';

import { ConfigUtil } from '@lambdascrew/utility';

import { HttpMethod, IGraphqlPayload, networkClient } from '../../../src/utils/helpers/networkRequest.util';
import { SimplePrimaryKey } from '../common/interfaces/workflow-key.interface';
import {
  ICreateOrganizationApiKey,
  IGetOrganization,
  IGetOrganizationApiKeyActive,
  ISaveOrganization,
  Organization,
} from './organization.entity';
import {
  CREATE_ORGANIZATION_API_KEY,
  GET_ORGANIZATION,
  GET_ORGANIZATION_API_KEY_ACTIVE,
  SAVE_ORGANIZATION,
} from './organization.gql-queries';

const endpoint = ConfigUtil.get('authBeEndpoint') || 'http://localhost:3001/api/graphql';

@Injectable()
export class OrganizationRepository {
  async saveOrganization(organization: Partial<Organization>) {
    if (process.env.NODE_ENV === 'test') return this.mockOrganization();

    const payload: IGraphqlPayload = {
      query: SAVE_ORGANIZATION,
      variables: { saveOrganizationInput: organization },
    };

    const response = (await networkClient({
      method: HttpMethod.POST,
      url: endpoint,
      headers: {},
      queryParams: {},
      bodyParams: payload,
    })) as ISaveOrganization;

    return response.data?.SaveOrganization;
  }

  async getOrganization(simplePrimaryKey: SimplePrimaryKey) {
    if (process.env.NODE_ENV === 'test') return this.mockOrganization();

    const payload: IGraphqlPayload = {
      query: GET_ORGANIZATION,
      variables: { getOrganizationInput: simplePrimaryKey },
    };

    const response = (await networkClient({
      method: HttpMethod.POST,
      url: endpoint,
      headers: {},
      queryParams: {},
      bodyParams: payload,
    })) as IGetOrganization;

    return response.data?.GetOrganization;
  }

  async getOrganizationApiKeyActive(simplePrimaryKey: SimplePrimaryKey) {
    const payload: IGraphqlPayload = {
      query: GET_ORGANIZATION_API_KEY_ACTIVE,
      variables: { getOrganizationApiKeyActiveInput: simplePrimaryKey },
    };

    const response = (await networkClient({
      method: HttpMethod.POST,
      url: endpoint,
      headers: {},
      queryParams: {},
      bodyParams: payload,
    })) as IGetOrganizationApiKeyActive;

    return response.data?.GetOrganizationApiKeyActive;
  }

  async createOrganizationApiKey(simplePrimaryKey: SimplePrimaryKey) {
    const payload: IGraphqlPayload = {
      query: CREATE_ORGANIZATION_API_KEY,
      variables: {
        createOrganizationApiKeyInput: {
          ...simplePrimaryKey,
          usagePlanName: ConfigUtil.get('apiGateway.usagePlanName'),
          restApiName: ConfigUtil.get('apiGateway.restApiName'),
        },
      },
    };

    const response = (await networkClient({
      method: HttpMethod.POST,
      url: endpoint,
      headers: {},
      queryParams: {},
      bodyParams: payload,
    })) as ICreateOrganizationApiKey;

    return response.data?.CreateOrganizationApiKey;
  }

  async mockOrganization() {
    return {
      PK: 'ORG#1234',
      ORGNAME: 'TestOrgName',
      TotalUSR: 0,
      TotalWLF: 1,
      APIKEY: [],
    };
  }
}
