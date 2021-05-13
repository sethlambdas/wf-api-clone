import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { GSI } from '../common/enums/gsi-names.enum';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { GetWorkflowStepByAidInput } from './inputs/get-workflow-step-by-aid.input';
import { WorkflowStep } from './workflow-step.entity';

@Injectable()
export class WorkflowStepRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflow'))
    private workflowStepModel: Model<WorkflowStep, CompositePrimaryKey>,
  ) {}

  async createWorkflowStep(workflowStep: WorkflowStep) {
    return this.workflowStepModel.create(workflowStep);
  }

  async batchCreateWorkflowStep(workflowStep: WorkflowStep[]) {
    return this.workflowStepModel.batchPut(workflowStep);
  }

  async saveWorkflowStep(key: CompositePrimaryKeyInput, workflowStep: Partial<WorkflowStep>) {
    return this.workflowStepModel.update(key, workflowStep);
  }

  async deleteWorkflowStep(key: CompositePrimaryKeyInput) {
    return this.workflowStepModel.delete(key);
  }

  async getWorkflowStepByKey(key: CompositePrimaryKeyInput) {
    return this.workflowStepModel.get(key);
  }

  async getWorkflowStepByAid(getWorkflowStepByAidInput: GetWorkflowStepByAidInput) {
    const { AID, WorkflowStepPK } = getWorkflowStepByAidInput;
    return this.workflowStepModel
      .query({ DATA: AID })
      .and()
      .where('PK')
      .beginsWith(WorkflowStepPK)
      .using(GSI.DataOverloading)
      .exec();
  }

  async getWorkflowStepWithinAVersion(WorkflowVersionSK: string) {
    const allWorkflowSteps = `WS#`;
    return await this.workflowStepModel
      .query({ PK: WorkflowVersionSK })
      .and()
      .where('SK')
      .beginsWith(allWorkflowSteps)
      .exec();
  }
}
