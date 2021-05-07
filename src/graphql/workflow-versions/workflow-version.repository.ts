import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { WorkflowKeys } from '../common/interfaces/workflow-key.interface';
import { GetAllWorkflowVersionsOfWorkflowInput } from './inputs/read-queries.inputs';
import { WorkflowVersion } from './workflow-version.entity';

@Injectable()
export class WorkflowVersionRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflow'))
    private workflowVersionModel: Model<WorkflowVersion, WorkflowKeys>,
  ) {}

  async createWorkflowVersion(workflowVersion: WorkflowVersion) {
    return this.workflowVersionModel.create(workflowVersion);
  }

  async saveWorkflowVersion(key: WorkflowKeys, workflowVersion: Partial<WorkflowVersion>) {
    return this.workflowVersionModel.update(key, workflowVersion);
  }

  async getAllWorkflowVersionsOfWorkflow(getAllWorkflowVersionsOfWorkflowInput: GetAllWorkflowVersionsOfWorkflowInput) {
    const { PK, WLFID } = getAllWorkflowVersionsOfWorkflowInput;

    const results = await this.workflowVersionModel.query({ PK }).and().where('SK').beginsWith(`${WLFID}|WV#`).exec();

    return results;
  }

  async deleteWorkflowVersion(key: WorkflowKeys) {
    return this.workflowVersionModel.delete(key);
  }

  async getWorkflowVersion(key: WorkflowKeys) {
    return this.workflowVersionModel.get(key);
  }

  async queryWorkflowVersion(filter: { [key: string]: any }): Promise<WorkflowVersion[]> {
    const workflowVersions: any = await this.workflowVersionModel.scan(filter).exec();
    return workflowVersions.toJSON();
  }

  async listWorkflowVersions(): Promise<WorkflowVersion[]> {
    const workflowVersions: any = await this.workflowVersionModel.scan().exec();
    return workflowVersions.toJSON();
  }
}
