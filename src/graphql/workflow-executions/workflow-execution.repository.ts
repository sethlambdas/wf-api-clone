import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { WorkflowExecution, WorkflowExecutionKey } from './workflow-execution.entity';

@Injectable()
export class WorkflowExecutionRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflowExecutions'))
    private workflowExecutionModel: Model<WorkflowExecution, WorkflowExecutionKey>,
  ) {}

  async createWorkflowExecution(workflowExecution: WorkflowExecution) {
    return this.workflowExecutionModel.create(workflowExecution);
  }

  async saveWorkflowExecution(key: WorkflowExecutionKey, workflowExecution: Partial<WorkflowExecution>) {
    return this.workflowExecutionModel.update(key, workflowExecution);
  }

  async deleteWorkflowExecution(key: WorkflowExecutionKey) {
    return this.workflowExecutionModel.delete(key);
  }

  async getWorkflowExecution(key: WorkflowExecutionKey) {
    return this.workflowExecutionModel.get(key);
  }

  async listWorkflowExecutions(): Promise<WorkflowExecution[]> {
    const workflowExecutions: any = await this.workflowExecutionModel.scan().exec();
    return workflowExecutions.toJSON();
  }
}
