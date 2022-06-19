import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '@lambdascrew/utility';

import { GSI } from '../common/enums/gsi-names.enum';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { PrefixWorkflowKeys } from './workflows.enum';

import { CreateWorkflowInputRepository } from './inputs/post.inputs';
import { GetWorkflowsOfAnOrgInput, GetWorkflowByUniqueKeyInput } from './inputs/get.inputs';
import { Status, WorkflowModelRepository } from './workflow.entity';

@Injectable()
export class WorkflowRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflow'))
    private workflowModel: Model<WorkflowModelRepository, CompositePrimaryKey>,
  ) {}

  async createWorkflow(createWorkflowInputRepository: CreateWorkflowInputRepository) {
    const { WorkflowName, OrgId, WorkflowBatchNumber, FAID, UQ_OVL, TriggerStatus, TimeTriggerRuleName } = createWorkflowInputRepository;

    console.log('CREATE WORKFLOW', TriggerStatus);

    const data: WorkflowModelRepository = {
      PK: this.formWorkflowTablePK(OrgId, WorkflowBatchNumber),
      SK: this.formWorkflowTableSK(WorkflowName),
      DATA: this.formWorkflowTableSK(WorkflowName),
      WLFN: WorkflowName,
      FAID,
      STATUS: Status.ACTIVE,
      UQ_OVL,
      TriggerStatus, 
    };

    if (TimeTriggerRuleName) data.TimeTriggerRuleName = TimeTriggerRuleName;

    const results = await this.workflowModel.create(data);

    return results;
  }

  async saveWorkflow(key: CompositePrimaryKeyInput, workflow: Partial<WorkflowModelRepository>) {
    return this.workflowModel.update(key, workflow);
  }

  async getWorkflowByKey(key: CompositePrimaryKeyInput) {
    const results = await this.workflowModel.get(key);
    return results;
  }

  async getCurrentWorkflowsOfBatch(orgId: string, batchNumber: number) {
    return this.workflowModel
      .query({ PK: `${orgId}|${PrefixWorkflowKeys.PK}#${batchNumber}` })
      .and()
      .where('SK')
      .beginsWith('WLF#')
      .count()
      .exec();
  }

  async getWorkflowByUniqueKey(getWorkflowByUniqueKeyInput: GetWorkflowByUniqueKeyInput) {
    const { UniqueKey } = getWorkflowByUniqueKeyInput;
    const results = await this.workflowModel
      .query({ UQ_OVL: `WLF-UQ#${UniqueKey}` })
      .and()
      .where('SK')
      .beginsWith('WLF#')
      .using(GSI.UniqueKeyOverloading)
      .exec();

    return results[0]
  }

  async getWorkflowByName(orgId: string, workflowName: string, TotalWLFBatches: number): Promise<WorkflowModelRepository> {
    const result = await new Promise(async (resolve) => {
      let searchNumber = 0; 

      const retrievedMatchedItems = async (startLoop: number, endLoop: number) => {
        for (let currentBatchNumber = startLoop; currentBatchNumber <= endLoop; currentBatchNumber++) {
          if (searchNumber === 2) return;
          
          const result = await this.workflowModel.get({ PK: this.formWorkflowTablePK(orgId, currentBatchNumber), SK: this.formWorkflowTableSK(workflowName) });

          if (result) {
            searchNumber = 2;
            return resolve(result)
          };
        }
        
        searchNumber += 1;
        if (searchNumber === 2 || TotalWLFBatches === 1) resolve(null);
      }

      if (TotalWLFBatches > 1) {
        const half = Math.floor(TotalWLFBatches / 2);
        retrievedMatchedItems(1, half);
        retrievedMatchedItems(half + 1, TotalWLFBatches);
      } else 
        retrievedMatchedItems(1, 1);
      
    }) as WorkflowModelRepository;

    return result;
  }

  async getWorkflowsOfAnOrg(getWorkflowsOfAnOrg: GetWorkflowsOfAnOrgInput & { TotalWLFBatches: number}) {
    const { orgId, page, search, TotalWLFBatches } = getWorkflowsOfAnOrg;

    if (search) {
      const result = await this.searchWorklowsWithFilter(orgId, TotalWLFBatches, search);
      return result;
    }

    return this.workflowModel
      .query({ PK: this.formWorkflowTablePK(orgId,page) })
      .and()
      .where('SK')
      .beginsWith('WLF#')
      .exec();
  }

  private async searchWorklowsWithFilter(orgId: string, TotalWLFBatches: number, search: string) {
    let searchNumber = 0;
    let results = [];
    
    const retrievedMatchedItems = async (startLoop: number, endLoop: number, resolve: (value: unknown) => void) => {
      let matchedItems = [];

      for (let currentBatchNumber = startLoop; currentBatchNumber <= endLoop; currentBatchNumber++) {
        const records = await this.workflowModel
          .query({ PK: this.formWorkflowTablePK(orgId, currentBatchNumber) })
          .and()
          .where('SK')
          .beginsWith(this.formWorkflowTableSK(search))
          .exec();
        
        matchedItems = [...matchedItems, ...records];
      }

      results = [...results, ...matchedItems];
      searchNumber += 1;
      if (searchNumber === 2 || TotalWLFBatches === 1) return resolve(null);
    }

    await new Promise((resolve) => {
      if (TotalWLFBatches > 1) {
        const half = Math.floor(TotalWLFBatches / 2);
        retrievedMatchedItems(1, half, resolve);
        retrievedMatchedItems(half + 1, TotalWLFBatches, resolve);
      } else 
        retrievedMatchedItems(1, 1, resolve);
    })

    return results;
  }

  private formWorkflowTablePK(orgId: string, WorkflowBatchNumber: number) {
    return `${orgId}|${PrefixWorkflowKeys.PK}#${WorkflowBatchNumber}`;
  }

  private formWorkflowTableSK(WorkflowName: string) {
    return `${PrefixWorkflowKeys.SK}#${WorkflowName}`;
  }
}
