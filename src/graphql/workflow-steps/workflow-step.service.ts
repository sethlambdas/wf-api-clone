import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { CreateWorkflowStepInput } from './inputs/create-workflow-step.input';
import { SaveWorkflowStepInput } from './inputs/save-workflow-step.input';
import { WorkflowStep, WorkflowStepKey } from './workflow-step.entity';
import { WorkflowStepRepository } from './workflow-step.repository';

@Injectable()
export class WorkflowStepService {
  constructor(
    @Inject(WorkflowStepRepository)
    private workflowStepRepository: WorkflowStepRepository,
  ) {}

  async createWorkflowStep(createWorkflowStepInput: CreateWorkflowStepInput) {
    const workflowStep = {
      ...createWorkflowStepInput,
      WSID: v4(),
    } as WorkflowStep;
    return this.workflowStepRepository.createWorkflowStep(workflowStep);
  }

  async saveWorkflowStep(id: string, saveWorkflowStepInput: SaveWorkflowStepInput) {
    const workflowStepKey = {
      WSID: id,
    } as WorkflowStepKey;
    const workflowStep = {
      ...saveWorkflowStepInput,
    } as WorkflowStep;
    return this.workflowStepRepository.saveWorkflowStep(workflowStepKey, workflowStep);
  }

  async getWorkflowStep(id: string) {
    const workflowStepKey = {
      WSID: id,
    } as WorkflowStepKey;
    return this.workflowStepRepository.getWorkflowStep(workflowStepKey);
  }

  async queryWorkflowStep(filter: { [key: string]: any }) {
    return this.workflowStepRepository.queryWorkflowStep(filter);
  }

  async deleteWorkflowStep(id: string) {
    const workflowStepKey = {
      WSID: id,
    } as WorkflowStepKey;
    return this.workflowStepRepository.deleteWorkflowStep(workflowStepKey);
  }

  async listWorkflowSteps() {
    return this.workflowStepRepository.listWorkflowSteps();
  }
}
