import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { QueryIndexWorkflowExecutionInput } from './inputs/queryIndex-workflow-execution.input';
import { QueryWorkflowExecution, WorkflowExecution, WorkflowExecutionKey } from './workflow-execution.entity';

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

  async scanWorkflowExecution(filter: { [key: string]: any }): Promise<WorkflowExecution[]> {
    const workflowExecutions: any = await this.workflowExecutionModel.scan(filter).exec();
    return workflowExecutions.toJSON();
  }

  async listWorkflowExecutions(): Promise<WorkflowExecution[]> {
    const workflowExecutions: any = await this.workflowExecutionModel.scan().exec();
    return workflowExecutions.toJSON();
  }

  async queryIndexWorkflowExecution(
    queryIndexWorkflowExecutionInput: QueryIndexWorkflowExecutionInput,
  ): Promise<QueryWorkflowExecution> {
    const { IndexName, PK, Value, pageSize, LastKey, page } = queryIndexWorkflowExecutionInput;
    let results: any;
    let workflowExecutions: any;
    let total: any;

    if (Value) {
      const keyExpression = { [`${PK}`]: Value };
      workflowExecutions = this.workflowExecutionModel.query(keyExpression);
      total = await this.workflowExecutionModel.query(keyExpression).count().exec();
    } else {
      workflowExecutions = this.workflowExecutionModel.scan();
      total = await this.workflowExecutionModel.scan().count().exec();
    }

    if (IndexName) workflowExecutions.using(IndexName);

    if (pageSize) workflowExecutions.limit(pageSize);

    if (LastKey) {
      workflowExecutions.startAt(LastKey);
      results = await workflowExecutions.exec();
    } else if (page) {
      let lastEvaluatedKey: any = null;
      for (let i = 0; i < page; i++) {
        if (lastEvaluatedKey) workflowExecutions.startAt(lastEvaluatedKey);
        results = await workflowExecutions.exec();
        lastEvaluatedKey = results.lastKey;
      }
    } else results = await workflowExecutions.exec();

    return {
      Executions: results.toJSON(),
      lastKey: results.lastKey,
      totalRecords: Value ? total.count : total.scannedCount,
    };
  }
}
