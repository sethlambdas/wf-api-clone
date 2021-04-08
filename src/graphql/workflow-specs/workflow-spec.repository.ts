import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { WorkflowSpec, WorkflowSpecKey } from './workflow-spec.interface';

@Injectable()
export class WorkflowSpecRepository {
  constructor(
    @InjectModel(ConfigUtil.get('aws.dynamodb.schema.workflowSpecs'))
    private workflowSpecModel: Model<WorkflowSpec, WorkflowSpecKey>,
  ) {}

  async createWorkflowSpec(workflowSpec: WorkflowSpec) {
    return this.workflowSpecModel.create(workflowSpec);
  }

  async saveWorkflowSpec(key: WorkflowSpecKey, workflowSpec: Partial<WorkflowSpec>) {
    return this.workflowSpecModel.update(key, workflowSpec);
  }

  async getWorkflowSpec(key: WorkflowSpecKey) {
    return this.workflowSpecModel.get(key);
  }

  async listWorkflowSpecs(): Promise<WorkflowSpec[]> {
    const workflowSpecs: any = await this.workflowSpecModel.scan().exec();
    return workflowSpecs.toJSON();
  }
}
