import { ConfigUtil } from '@lambdascrew/utility';
import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { SimplePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { Resources } from './resources.entity';

@Injectable()
export class ResourcesRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.resources'))
    private resourcesModel: Model<Resources, SimplePrimaryKey>,
  ) {}

  async createResource(createResourceInput: Resources): Promise<Resources | null> {
    const results = await this.resourcesModel.create(createResourceInput);
    return results;
  }

  async updateResource(primaryKey: string, createResourceInput: Partial<Resources>): Promise<Resources> {
    // const results = await this.resourcesModel.create(createResourceInput);
    const pKey: SimplePrimaryKey = {
      PK: primaryKey,
    };
    const resource = await this.resourcesModel.get(pKey);
    if (resource) {
      const result = await this.resourcesModel.update(pKey, createResourceInput);
      return result;
    }
    return;
  }

  async countResources(): Promise<number> {
    const { count } = await this.resourcesModel.scan().all().count().exec();
    return count;
  }

  async getAllResources(): Promise<Resources[]> {
    const resources: Resources[] = await this.resourcesModel.scan().all().exec();
    return resources;
  }

  async getResourceByPK(primaryKey: string): Promise<Resources | null> {
    const pKey: SimplePrimaryKey = {
      PK: primaryKey,
    };
    const resource: Resources = await this.resourcesModel.get(pKey);
    return resource;
  }
}
