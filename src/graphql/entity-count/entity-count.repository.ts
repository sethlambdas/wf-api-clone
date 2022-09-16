import { ConfigUtil } from '@lambdascrew/utility';
import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { CompositePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';

// import { CompositePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { EntityCount } from './entitiy-count.entity';

@Injectable()
export class EntityCountRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.integrations'))
    private entityCountModel: Model<EntityCount, CompositePrimaryKey>,
  ) {}

  async createEntityCount(): Promise<EntityCount> {
    const entityCount: EntityCount = {
      PK: 'PK#ENTITY-COUNT',
      SK: 'SK#ENTITY-COUNT',
      totalIntApp: 0,
    };

    const results = await this.entityCountModel.create(entityCount);
    return results;
  }

  async findEntityCount(): Promise<EntityCount> {
    const primaryKey: CompositePrimaryKey = {
      PK: 'PK#ENTITY-COUNT',
      SK: 'SK#ENTITY-COUNT',
    };

    const results = await this.entityCountModel.get(primaryKey);

    return results;
  }

  async saveEntityCount(entityCount: Partial<EntityCount>) {
    const primaryKey: CompositePrimaryKey = {
      PK: 'PK#ENTITY-COUNT',
      SK: 'SK#ENTITY-COUNT',
    };

    return this.entityCountModel.update(primaryKey, entityCount);
  }
}
