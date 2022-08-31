import { ConfigUtil } from '@lambdascrew/utility';
import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';

import { CompositePrimaryKey } from '@graphql:common/interfaces/dynamodb-keys.interface';
import { ListIntegrationAppRecordsRepoInput } from './inputs/list-integration-app.input';
import { IntegrationApp } from './integration-app.entity';

@Injectable()
export class IntegrationAppRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.integrations'))
    private integrationAppModel: Model<IntegrationApp, CompositePrimaryKey>,
  ) {}

  async createIntegrationApp(createIntegrationAppInput: IntegrationApp): Promise<IntegrationApp> {
    const results = await this.integrationAppModel.create(createIntegrationAppInput);
    return results;
  }

  async findIntegrationAppByPK(primaryKey: CompositePrimaryKey): Promise<IntegrationApp | null> {
    const result = await this.integrationAppModel.get(primaryKey);
    return result;
  }

  async findIntegrationAppByName(integrationAppName: string, totalIntApp: number): Promise<IntegrationApp | null> {
    let intAppNumber = 1;

    while (intAppNumber <= totalIntApp) {
      const primaryKey: CompositePrimaryKey = {
        PK: `INT-APP||${intAppNumber}`,
        SK: `INT-APP||${intAppNumber}||metadata`,
      };

      const result = await this.integrationAppModel.get(primaryKey);

      if (result && result.name === integrationAppName.trim()) return result;

      ++intAppNumber;
    }

    return null;
  }

  async listIntegrationAppRecords(listIntegrationAppRecordsInput: ListIntegrationAppRecordsRepoInput) {
    const { totalIntApp, page, pageSize } = listIntegrationAppRecordsInput;

    let results: any;
    const readItems = [];
    let intAppNumber = pageSize * page - pageSize + 1;
    let index = 1;

    while (index <= pageSize && intAppNumber <= totalIntApp) {
      readItems.push({
        PK: 'INT-APP' + '||' + intAppNumber,
        SK: 'INT-APP' + '||' + intAppNumber + '||metadata',
      });

      ++intAppNumber;
      ++index;
    }

    if (readItems.length > 0) results = await this.runBatchGetItems(readItems);

    if (results) return results;
    else return [];
  }

  private async runBatchGetItems(readItems: CompositePrimaryKey[]) {
    const response1 = await this.integrationAppModel.batchGet(readItems);
    if (response1.unprocessedKeys.length > 0) {
      const response2 = await this.runBatchGetItems(response1.unprocessedKeys as CompositePrimaryKey[]);
      return [...response1, ...response2];
    }
    return [...response1];
  }

  // for testing in jest use only!!!!
  async scanIntegrationAppRecords() {
    return this.integrationAppModel.scan().exec();
  }

  async deleteIntegrationAppRecords(primaryKey: CompositePrimaryKey) {
    await this.integrationAppModel.delete(primaryKey);
  }
}
