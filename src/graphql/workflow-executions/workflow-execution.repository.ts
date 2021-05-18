import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { ListWorkflowExecutionsOfAVersionInput } from './inputs/get-workflow-executions-of-version.input';
import { WorkflowExecution } from './workflow-execution.entity';

@Injectable()
export class WorkflowExecutionRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflow'))
    private workflowExecutionModel: Model<WorkflowExecution, CompositePrimaryKey>,
  ) {}

  async createWorkflowExecution(workflowExecution: WorkflowExecution) {
    return this.workflowExecutionModel.create(workflowExecution);
  }

  async saveWorkflowExecution(key: CompositePrimaryKeyInput, workflowExecution: Partial<WorkflowExecution>) {
    return this.workflowExecutionModel.update(key, workflowExecution);
  }

  async deleteWorkflowExecution(key: CompositePrimaryKeyInput) {
    return this.workflowExecutionModel.delete(key);
  }

  async getWorkflowExecutionByKey(key: CompositePrimaryKeyInput) {
    return this.workflowExecutionModel.get(key);
  }

  async listWorkflowExecutionsOfAVersion(listWorkflowExecutionsOfAVersionInput: ListWorkflowExecutionsOfAVersionInput) {
    const { workflowVersionSK, TotalEXC, page, pageSize } = listWorkflowExecutionsOfAVersionInput;

    let results: any;
    const readItems = [];
    let wlfExecNumber = pageSize * page - pageSize + 1;
    let index = 1;

    while (index <= pageSize && wlfExecNumber <= TotalEXC) {
      readItems.push({
        PK: `${workflowVersionSK}|WX#${wlfExecNumber}`,
        SK: `WX#${wlfExecNumber}`,
      });

      ++wlfExecNumber;
      ++index;
    }

    if (readItems.length > 0) results = await this.runBatchGetItems(readItems);

    if (results) return results;
    else return [];
  }

  async runBatchGetItems(readItems: any) {
    const response1 = await this.workflowExecutionModel.batchGet(readItems);
    if (response1.unprocessedKeys.length > 0) {
      const response2 = await this.runBatchGetItems(response1.unprocessedKeys);
      return [...response1, ...response2];
    }
    return [...response1];
  }
}
