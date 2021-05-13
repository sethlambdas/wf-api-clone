import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { GSI } from '../common/enums/gsi-names.enum';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { ListAllManualApprovalInput } from './inputs/get-all-approval.input';
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
      .query({ Status })
      .and()
      .where('SK')
      .beginsWith(allManualApprovalOfOrg)
      .using(GSI.GetActivityTypeAccordingToStatus)
      .attributes(['PK', 'SK', 'MD', 'WSID', 'WLFN']);

    const { count } = await this.workflowStepExecutionHistoryModel
      .query({ Status })
      .and()
      .where('SK')
      .beginsWith(allManualApprovalOfOrg)
      .using(GSI.GetActivityTypeAccordingToStatus)
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

  async deleteWorkflowStepExecutionHistory(key: CompositePrimaryKeyInput) {
    return this.workflowStepExecutionHistoryModel.delete(key);
  }
}
