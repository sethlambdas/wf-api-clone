import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';

import { ConfigUtil } from '@lambdascrew/utility';

import { GSI } from '../common/enums/gsi-names.enum';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { ListAllManualApprovalInput } from './inputs/get-all-approval.input';
import { ListWorkflowStepExecutionHistoryOfAnExecutionInput } from './inputs/list-workflow-execution-step-history-of-execution.input';
import { WorkflowStepExecutionHistory } from './workflow-steps-wxh.entity';

@Injectable()
export class WorkflowStepExecutionHistoryRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflow'))
    private workflowStepExecutionHistoryModel: Model<WorkflowStepExecutionHistory, CompositePrimaryKey>,
  ) {}

  async createWorkflowStepExecutionHistory(workflowStepExecutionHistory: WorkflowStepExecutionHistory) {
    return this.workflowStepExecutionHistoryModel.create(workflowStepExecutionHistory);
  }

  async saveWorkflowStepExecutionHistory(
    key: CompositePrimaryKeyInput,
    workflowStepExecutionHistory: Partial<WorkflowStepExecutionHistory>,
  ) {
    return this.workflowStepExecutionHistoryModel.update(key, workflowStepExecutionHistory);
  }

  async getWorkflowStepExecutionHistoryByKey(key: CompositePrimaryKey) {
    return this.workflowStepExecutionHistoryModel.get(key);
  }

  async listAllManualApproval(listAllManualApprovalInput: ListAllManualApprovalInput) {
    const { OrgId, Status, LastKey, pageSize, page } = listAllManualApprovalInput;

    const allManualApprovalOfOrg = `WSXH|${OrgId}|ManualApproval|`;
    let results: any;

    const query = this.workflowStepExecutionHistoryModel
      .query({ UQ_OVL: Status })
      .and()
      .where('SK')
      .beginsWith(allManualApprovalOfOrg)
      .using(GSI.UniqueKeyOverloading)
      .attributes(['PK', 'SK', 'MD', 'WSID', 'WLFN']);

    const { count } = await this.workflowStepExecutionHistoryModel
      .query({ UQ_OVL: Status })
      .and()
      .where('SK')
      .beginsWith(allManualApprovalOfOrg)
      .using(GSI.UniqueKeyOverloading)
      .count()
      .all()
      .exec();

    if (pageSize) query.limit(pageSize);

    if (LastKey) {
      const startAtKey = JSON.parse(LastKey);
      query.startAt(startAtKey);
      results = await query.exec();
    } else if (page) {
      let lastEvaluatedKey: any = null;
      for (let i = 0; i < page; i++) {
        if (lastEvaluatedKey) query.startAt(lastEvaluatedKey);
        results = await query.exec();
        lastEvaluatedKey = results.lastKey;
      }
    }

    return {
      results,
      TotalRecords: count,
    };
  }

  async listAllWorkflowStepExecutionHistoryOfAnExecution(
    listWorkflowStepExecutionHistoryOfAnExecutionInput: ListWorkflowStepExecutionHistoryOfAnExecutionInput,
  ) {
    const { workflowExecutionPK } = listWorkflowStepExecutionHistoryOfAnExecutionInput;

    const workflowStepExecutionHistories = await this.workflowStepExecutionHistoryModel
      .query({ PK: workflowExecutionPK })
      .and()
      .where('SK')
      .beginsWith(`WSXH|`)
      .exec();

    return {
      workflowStepExecutionHistories,
      TotalRecords: workflowStepExecutionHistories.length,
    };
  }

  async deleteWorkflowStepExecutionHistory(key: CompositePrimaryKeyInput) {
    return this.workflowStepExecutionHistoryModel.delete(key);
  }
}
