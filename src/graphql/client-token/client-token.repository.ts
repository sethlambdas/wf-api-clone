import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';

import { ConfigUtil } from '@lambdascrew/utility';

import { SimplePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { ClientToken } from './client-token.entity';

@Injectable()
export class ClientTokenRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.integrationTokens'))
    private clientTokenModel: Model<ClientToken, SimplePrimaryKey>,
  ) {}

  async createClientToken(clientToken: ClientToken): Promise<ClientToken> {
    const results = await this.clientTokenModel.create(clientToken);

    return results;
  }

  async saveClientToken(key: SimplePrimaryKey, clientToken: Partial<ClientToken>) {
    return this.clientTokenModel.update(key, clientToken);
  }

  async findClientTokenByPK(primaryKey: SimplePrimaryKey): Promise<ClientToken> {
    const results = await this.clientTokenModel.get(primaryKey);

    return results;
  }

  // for testing in jest use only!!!!
  async scanClientTokenRecords() {
    return this.clientTokenModel.scan().exec();
  }

  async deleteClientTokenRecords(primaryKey: SimplePrimaryKey) {
    await this.clientTokenModel.delete(primaryKey);
  }
}
