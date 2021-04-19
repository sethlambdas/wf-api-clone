import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { WorkflowVersion, WorkflowVersionKey } from './workflow-version.entity';

@Injectable()
export class WorkflowVersionRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflowVersions'))
    private workflowVersionModel: Model<WorkflowVersion, WorkflowVersionKey>,
  ) {}

  async createWorkflowVersion(workflowVersion: WorkflowVersion) {
    return this.workflowVersionModel.create(workflowVersion);
  }

  async saveWorkflowVersion(key: WorkflowVersionKey, workflowVersion: Partial<WorkflowVersion>) {
    return this.workflowVersionModel.update(key, workflowVersion);
  }

  async deleteWorkflowVersion(key: WorkflowVersionKey) {
    return this.workflowVersionModel.delete(key);
  }

  async getWorkflowVersion(key: WorkflowVersionKey) {
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
