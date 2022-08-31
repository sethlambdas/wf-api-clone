import { ConfigUtil } from '@lambdascrew/utility';
import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';

import { SimplePrimaryKey } from '@graphql:common/interfaces/dynamodb-keys.interface';
import { ApigwAuthorizer } from './apigw-authorizer.entity';

@Injectable()
export class ApigwAuthorizerRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.apigwAuthorizer'))
    private apigwAuthorizerModel: Model<ApigwAuthorizer, SimplePrimaryKey>,
  ) {}

  async createApigwAuthorizer(apigwAuthorizer: ApigwAuthorizer): Promise<ApigwAuthorizer> {
    const results = await this.apigwAuthorizerModel.create(apigwAuthorizer);

    return results;
  }

  async findApigwAuthorizerByPK(primaryKey: SimplePrimaryKey): Promise<ApigwAuthorizer> {
    const prefixedKey = { PK: `wlfId||${primaryKey.PK}` };
    const results = await this.apigwAuthorizerModel.get(prefixedKey);

    return results;
  }

  async saveApigwAuthorizer(key: SimplePrimaryKey, apigwAuthorizer: Partial<ApigwAuthorizer>) {
    return this.apigwAuthorizerModel.update(key, apigwAuthorizer);
  }
}
