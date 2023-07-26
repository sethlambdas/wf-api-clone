import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';

import { ConfigUtil } from '@lambdascrew/utility';

import { GSI } from '../common/enums/gsi-names.enum';
import { SimplePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { IRefreshToken, ISignOut, RefreshToken, User } from './user.entity';
import { HttpMethod, IGraphqlPayload, networkClient } from '../../utils/helpers/networkRequest.util';
import { LOGOUT_QL, REFRESH_TOKEN_QL } from './user.qgl-queries';

const endpoint = ConfigUtil.get('authBeEndpoint') || 'http://localhost:3001/api/graphql';
@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.authUsers'))
    private userModel: Model<User, SimplePrimaryKey>,
  ) {}

  async createUser(user: User) {
    return this.userModel.create(user);
  }

  async saveUser(key: SimplePrimaryKey, user: Partial<User>) {
    return this.userModel.update(key, user);
  }

  async getUserByKey(key: SimplePrimaryKey) {
    return this.userModel.get(key);
  }

  async getAllUsersOfOrg() {
    const users: User[] = await this.userModel.scan().all().exec();
    return users
  }

  async getUserByEmail(email: string) {
    const result = await this.userModel.query({ email }).using(GSI.GSIEmailIndex).exec();
    return result[0];
  }

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
