import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { WorkflowStep, WorkflowStepKey } from './workflow-step.entity';

@Injectable()
export class WorkflowStepRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflowSteps'))
    private workflowStepModel: Model<WorkflowStep, WorkflowStepKey>,
  ) {}

  async createWorkflowStep(workflowStep: WorkflowStep) {
    return this.workflowStepModel.create(workflowStep);
  }

  async saveWorkflowStep(key: WorkflowStepKey, workflowStep: Partial<WorkflowStep>) {
    return this.workflowStepModel.update(key, workflowStep);
  }

  async deleteWorkflowStep(key: WorkflowStepKey) {
    return this.workflowStepModel.delete(key);
  }

  async getWorkflowStep(key: WorkflowStepKey) {
    return this.workflowStepModel.get(key);
  }

  async queryWorkflowStep(filter: { [key: string]: any }): Promise<WorkflowStep[]> {
    const workflowSteps: any = await this.workflowStepModel.scan(filter).exec();
    return workflowSteps.toJSON();
  }

  async listWorkflowSteps(): Promise<WorkflowStep[]> {
    const workflowSteps: any = await this.workflowStepModel.scan().exec();
    return workflowSteps.toJSON();
  }
}
