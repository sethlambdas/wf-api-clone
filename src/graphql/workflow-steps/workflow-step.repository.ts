import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { GSI } from '../common/enums/gsi-names.enum';
import { WorkflowKeysInput } from '../common/inputs/workflow-key.input';
import { WorkflowKeys } from '../common/interfaces/workflow-key.interface';
import { WorkflowStep } from './workflow-step.entity';

@Injectable()
export class WorkflowStepRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflow'))
    private workflowStepModel: Model<WorkflowStep, WorkflowKeys>,
  ) {}

  async createWorkflowStep(workflowStep: WorkflowStep) {
    return this.workflowStepModel.create(workflowStep);
  }

  async batchCreateWorkflowStep(workflowStep: WorkflowStep[]) {
    return this.workflowStepModel.batchPut(workflowStep);
  }

  async saveWorkflowStep(key: WorkflowKeysInput, workflowStep: Partial<WorkflowStep>) {
    return this.workflowStepModel.update(key, workflowStep);
  }

  async deleteWorkflowStep(key: WorkflowKeysInput) {
    return this.workflowStepModel.delete(key);
  }

  async getWorkflowStep(key: WorkflowKeysInput) {
    return this.workflowStepModel.get(key);
  }

  async getWorkflowStepByAid(AID: string, OrgId: string) {
    return this.workflowStepModel
      .query({ DATA: AID })
      .and()
      .where('PK')
      .beginsWith(OrgId)
      .using(GSI.DataOverloading)
      .exec();
  }

  async getWorkflowStepWithinAVersion(OrgId: string, WorkflowVersionSK: string) {
    const allWorkflowSteps = `${WorkflowVersionSK}|WS#`;
    return await this.workflowStepModel.query({ PK: OrgId }).and().where('SK').beginsWith(allWorkflowSteps).exec();
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
