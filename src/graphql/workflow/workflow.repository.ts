import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { GSI } from '../common/enums/gsi-names.enum';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { CreateWorkflowInputRepository } from './inputs/create-workflow.input';
import { GetWorkflowByNameInput } from './inputs/get-workflow-by-name.input';
import { ListWorkflowsOfAnOrgInput } from './inputs/list-workflows.input';
import { WorkflowModelRepository } from './workflow.entity';

@Injectable()
export class WorkflowRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflow'))
    private workflowModel: Model<WorkflowModelRepository, CompositePrimaryKey>,
  ) {}

  async createWorkflow(createWorkflowInputRepository: CreateWorkflowInputRepository) {
    const { WorkflowName, OrgId, WorkflowNumber } = createWorkflowInputRepository;

    const newWorkflowNumber = WorkflowNumber + 1;

    const results = await this.workflowModel.create({
      PK: `${OrgId}|WLF#${newWorkflowNumber}`,
      SK: `WLF#${newWorkflowNumber}`,
      DATA: `WLF#${WorkflowName}`,
      WLFN: WorkflowName,
    });

    return results;
  }

  async getWorkflowByKey(key: CompositePrimaryKeyInput) {
    const results = await this.workflowModel.get(key);
    return results;
  }

  async getWorkflowByName(getWorkflowByNameInput: GetWorkflowByNameInput) {
    const { WorkflowName, OrgId } = getWorkflowByNameInput;
    return this.workflowModel
      .query({ DATA: `WLF#${WorkflowName}` })
      .and()
      .where('PK')
      .beginsWith(OrgId)
      .using(GSI.DataOverloading)
      .exec();
  }

  async listWorkflowsOfAnOrg(listWorkflowsOfAnOrgInput: ListWorkflowsOfAnOrgInput) {
    const { OrgId, TotalWLF, page, pageSize } = listWorkflowsOfAnOrgInput;

    let results: any;
    const readItems = [];
    let wlfNumber = pageSize * page - pageSize + 1;
    let index = 1;

    while (index <= pageSize && wlfNumber <= TotalWLF) {
      readItems.push({
        PK: `${OrgId}|WLF#${wlfNumber}`,
        SK: `WLF#${wlfNumber}`,
      });

      ++wlfNumber;
      ++index;
    }

    if (readItems.length > 0) results = await this.runBatchGetItems(readItems);

    if (results) return results;
    else return [];
  }

  async runBatchGetItems(readItems: any) {
    const response1 = await this.workflowModel.batchGet(readItems);
    if (response1.unprocessedKeys.length > 0) {
      const response2 = await this.runBatchGetItems(response1.unprocessedKeys);
      return [...response1, ...response2];
    }
    return [...response1];
  }
}
