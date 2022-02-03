import { ConfigUtil } from '@lambdascrew/utility';
import { Injectable } from '@nestjs/common';

import { HttpMethod, IGraphqlPayload, networkClient } from '../../utils/helpers/networkRequest.util';
import { ApigwAuthorizer, ICreateApigwAuthorizer, IFindApigwAuthorizer } from './apigw-authorizer.entity';
import { CREATE_APIGW_AUTHORIZER, FIND_APIGW_AUTHORIZER_BY_PK } from './apigw-authorizer.gql-queries';
import { CreateApigwAuthorizerInput } from './inputs/create-apigw-authorizer.input';
import { FindApigwAuthorizerByPkInput } from './inputs/find-apigw-authorizer.input';

const endpoint = ConfigUtil.get('authBeEndpoint') || 'http://localhost:3001/api/graphql';

@Injectable()
export class ApigwAuthorizerRepository {
  async findApigwAuthorizerByPk(findApigwAuthorizerByPkInput: FindApigwAuthorizerByPkInput): Promise<ApigwAuthorizer> {
    const payload: IGraphqlPayload = {
      query: FIND_APIGW_AUTHORIZER_BY_PK,
      variables: { inputs: findApigwAuthorizerByPkInput },
    };

    const response = (await networkClient({
      method: HttpMethod.POST,
      url: endpoint,
      headers: {},
      queryParams: {},
      bodyParams: payload,
    })) as IFindApigwAuthorizer;

    return response.data.FindApigwAuthorizerByPK;
  }

  async createApigwAuthorizerByPk(createApigwAuthorizerInput: CreateApigwAuthorizerInput): Promise<ApigwAuthorizer> {
    const payload: IGraphqlPayload = {
      query: CREATE_APIGW_AUTHORIZER,
      variables: { inputs: { ...createApigwAuthorizerInput } },
    };

    const response = (await networkClient({
      method: HttpMethod.POST,
      url: endpoint,
      headers: {},
      queryParams: {},
      bodyParams: payload,
    })) as ICreateApigwAuthorizer;

    return response.data.CreateApigwAuthorizer;
  }
}
