import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { GetAllWorkflowVersionsOfWorkflowInput } from './inputs/read-queries.inputs';
import { WorkflowVersion } from './workflow-version.entity';

@Injectable()
export class WorkflowVersionRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflow'))
    private workflowVersionModel: Model<WorkflowVersion, CompositePrimaryKey>,
  ) {}

  async createWorkflowVersion(workflowVersion: WorkflowVersion) {
    return this.workflowVersionModel.create(workflowVersion);
  }

  async saveWorkflowVersion(key: CompositePrimaryKeyInput, workflowVersion: Partial<WorkflowVersion>) {
    return this.workflowVersionModel.update(key, workflowVersion);
  }

  async getAllWorkflowVersionsOfWorkflow(getAllWorkflowVersionsOfWorkflowInput: GetAllWorkflowVersionsOfWorkflowInput) {
    const { WorkflowPK } = getAllWorkflowVersionsOfWorkflowInput;

    const results = await this.workflowVersionModel
      .query({ PK: WorkflowPK })
      .and()
      .where('SK')
      .beginsWith(`WV#`)
      .exec();

    return results;
  }

  async deleteWorkflowVersion(key: CompositePrimaryKeyInput) {
    return this.workflowVersionModel.delete(key);
  }

  async getWorkflowVersionByKey(key: CompositePrimaryKeyInput) {
    return this.workflowVersionModel.get(key);
  }
}
