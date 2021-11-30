import { Injectable } from '@nestjs/common';

import { ConfigUtil } from '@lambdascrew/utility';

import { HttpMethod, IGraphqlPayload, networkClient } from '../../utils/helpers/networkRequest.util';

import { IRefreshToken, ISignOut, RefreshToken } from './user.entity';
import { LOGOUT_QL, REFRESH_TOKEN_QL } from './user.gql-queries';

const endpoint = ConfigUtil.get('authBeEndpoint') || 'http://localhost:3001/api/graphql';

@Injectable()
export class UserRepository {
  async refreshToken(res: any, refreshToken: string) {
    const payload: IGraphqlPayload = {
      query: REFRESH_TOKEN_QL,
      variables: { refreshToken },
    };

    const response = (await networkClient({
      method: HttpMethod.POST,
      url: endpoint,
      headers: {},
      queryParams: {},
      bodyParams: payload,
    })) as IRefreshToken;

    await this.setCookie(res, response?.data?.RefreshToken);
    res.json(response?.data?.RefreshToken);
  }

  async setCookie(res: any, token: RefreshToken) {
    if (!token) return;
    const { refreshTokenGenerate, cookieOptions } = token;
    res.cookie('refreshToken', refreshTokenGenerate, cookieOptions);
  }

  async logout(res: any) {
    const payload: IGraphqlPayload = {
      query: LOGOUT_QL,
      variables: {},
    };

    const response = (await networkClient({
      method: HttpMethod.POST,
      url: endpoint,
      headers: {},
      queryParams: {},
      bodyParams: payload,
    })) as ISignOut;

    res.clearCookie('refreshToken');
    res.json(response?.data?.SignOut);
  }
}
