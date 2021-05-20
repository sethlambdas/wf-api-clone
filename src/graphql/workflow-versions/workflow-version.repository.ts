import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { getPaginatedData } from '../../utils/array-helpers.util';
import { ConfigUtil } from '../../utils/config.util';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { ListAllWorkflowVersionsOfWorkflowInput } from './inputs/read-queries.inputs';
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

  async listAllWorkflowVersionsOfWorkflow(
    listAllWorkflowVersionsOfWorkflowInput: ListAllWorkflowVersionsOfWorkflowInput,
  ) {
    const { WorkflowPK, page, pageSize, sortBy, sortDir } = listAllWorkflowVersionsOfWorkflowInput;

    const workflowVersions = await this.workflowVersionModel
      .query({ PK: WorkflowPK })
      .and()
      .where('SK')
      .beginsWith(`WV#`)
      .exec();

    const paginatedWorkflowVersions = getPaginatedData(workflowVersions, sortBy, sortDir, page, pageSize);

    return {
      workflowVersions: paginatedWorkflowVersions,
      TotalRecords: workflowVersions.length,
    };
  }

  async deleteWorkflowVersion(key: CompositePrimaryKeyInput) {
    return this.workflowVersionModel.delete(key);
  }

  async getWorkflowVersionByKey(key: CompositePrimaryKeyInput) {
    return this.workflowVersionModel.get(key);
  }
}
