import { Inject, Injectable } from '@nestjs/common';

import { CompositePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { EntityCountService } from '../entity-count/entitiy-count.service';

import { CreateIntegrationAppInput } from './inputs/create-integration-app.inputs';
import {
  ListIntegrationAppRecordsInput,
  ListIntegrationAppRecordsRepoInput,
} from './inputs/list-integration-app.input';
import { IntegrationApp } from './integration-app.entity';
import { IntegrationAppRepository } from './integration-app.repository';

@Injectable()
export class IntegrationAppService {
  constructor(
    @Inject(IntegrationAppRepository)
    private integrationAppRepository: IntegrationAppRepository,
    private entityCountService: EntityCountService,
  ) {}

  async createIntegrationApp(createIntegrationAppInput: CreateIntegrationAppInput): Promise<IntegrationApp | null> {
    const entityCount = await this.entityCountService.findEntityCount();

    const isRecordExist = await this.integrationAppRepository.findIntegrationAppByName(
      createIntegrationAppInput.name.trim(),
      entityCount.totalIntApp,
    );

    if (isRecordExist) return isRecordExist;

    const pk = 'INT-APP' + '||' + (entityCount.totalIntApp + 1);

    const integrationApp: IntegrationApp = {
      PK: pk,
      SK: pk + '||' + 'metadata',
      ...createIntegrationAppInput,
    };

    const result = await this.integrationAppRepository.createIntegrationApp(integrationApp);

    if (result) await this.entityCountService.saveEntityCount({ totalIntApp: entityCount.totalIntApp + 1 });

    return result;
  }

  async findIntegrationAppByPK(primaryKey: CompositePrimaryKey): Promise<IntegrationApp | null> {
    const result = await this.integrationAppRepository.findIntegrationAppByPK(primaryKey);
    return result;
  }

  async findIntegrationAppByName(integrationAppName: string): Promise<IntegrationApp | null> {
    const entityCount = await this.entityCountService.findEntityCount();

    const integrationApp = await this.integrationAppRepository.findIntegrationAppByName(
      integrationAppName,
      entityCount.totalIntApp,
    );

    if (integrationApp) return integrationApp;
    return null;
  }

  async listIntegrationAppRecords(listIntegrationAppRecordsInput: ListIntegrationAppRecordsInput) {
    const entityCount = await this.entityCountService.findEntityCount();

    const listIntegrationAppRecordsRepoInput: ListIntegrationAppRecordsRepoInput = {
      ...listIntegrationAppRecordsInput,
      totalIntApp: entityCount.totalIntApp,
    };

    return this.integrationAppRepository.listIntegrationAppRecords(listIntegrationAppRecordsRepoInput);
  }

  // for testing in jest use only!!!!
  async scanIntegrationAppRecords() {
    return this.integrationAppRepository.scanIntegrationAppRecords();
  }

  async deleteIntegrationAppRecords(primaryKey: CompositePrimaryKey) {
    await this.integrationAppRepository.deleteIntegrationAppRecords(primaryKey);
  }
}
