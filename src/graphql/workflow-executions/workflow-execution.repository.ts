import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { WorkflowKeysInput } from '../common/inputs/workflow-key.input';
import { WorkflowKeys } from '../common/interfaces/workflow-key.interface';
import { QueryListWFExecutionsInput } from './inputs/query-list-workflow-execution.input';
import { QueryWorkflowExecutionsInput } from './inputs/query-workflow-execution.input';
import { QueryListWFExecutions, WorkflowExecution } from './workflow-execution.entity';

@Injectable()
export class WorkflowExecutionRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflow'))
    private workflowExecutionModel: Model<WorkflowExecution, WorkflowKeys>,
  ) {}

  async createWorkflowExecution(workflowExecution: WorkflowExecution) {
    return this.workflowExecutionModel.create(workflowExecution);
  }

  async saveWorkflowExecution(key: WorkflowKeysInput, workflowExecution: Partial<WorkflowExecution>) {
    return this.workflowExecutionModel.update(key, workflowExecution);
  }

  async deleteWorkflowExecution(key: WorkflowKeysInput) {
    return this.workflowExecutionModel.delete(key);
  }

  async getWorkflowExecution(key: WorkflowKeysInput) {
    return this.workflowExecutionModel.get(key);
  }

  async scanWorkflowExecution(filter: { [key: string]: any }): Promise<WorkflowExecution[]> {
    const workflowExecutions: any = await this.workflowExecutionModel.scan(filter).exec();
    return workflowExecutions.toJSON();
  }

  async queryWorkflowExecution(queryWorkflowExecutionsInput: QueryWorkflowExecutionsInput) {
    const {
      indexName,
      primaryKey: { PK, PKValue, SK, SKValue },
    } = queryWorkflowExecutionsInput;

    const keyExpressionConditions = { [`${PK}`]: PKValue };
    if (SK) keyExpressionConditions[`${SK}`] = SKValue;

    const workflowExecutions = this.workflowExecutionModel.query(keyExpressionConditions);

    if (indexName) workflowExecutions.using(indexName);
    const result: any = await workflowExecutions.exec();
    return result.toJSON();
  }

  async listWorkflowExecutions(): Promise<WorkflowExecution[]> {
    const workflowExecutions: any = await this.workflowExecutionModel.scan().exec();
    return workflowExecutions.toJSON();
  }

  async queryListWFExecutions(queryListWFExecutionsInput: QueryListWFExecutionsInput): Promise<QueryListWFExecutions> {
    const { IndexName, PK, Value, pageSize, LastKey, page } = queryListWFExecutionsInput;
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
