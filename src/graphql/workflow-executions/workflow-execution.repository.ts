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
    const { OrgId, workflowVersionSK } = listWorkflowExecutionsOfAVersionInput;
    const allWorkflowExecutions = `${workflowVersionSK}|WX#`;
    const results = await this.workflowExecutionModel
      .query({ PK: OrgId })
      .and()
      .where('SK')
      .beginsWith(allWorkflowExecutions)
      .exec();
    return results;
  }
}
