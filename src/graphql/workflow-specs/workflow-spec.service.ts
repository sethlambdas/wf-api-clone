import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { CreateWorkflowSpecInput } from './inputs/create-workflow-spec.input';
import { SaveWorkflowSpecInput } from './inputs/save-workflow-spec.input';
import { WorkflowSpec, WorkflowSpecKey } from './workflow-spec.entity';
import { WorkflowSpecRepository } from './workflow-spec.repository';

@Injectable()
export class WorkflowSpecService {
  constructor(
    @Inject(WorkflowSpecRepository)
    private workflowSpecRepository: WorkflowSpecRepository,
  ) {}

  async createWorkflowSpec(createWorkflowSpecInput: CreateWorkflowSpecInput) {
    const workflowSpec = {
      ...createWorkflowSpecInput,
      WSID: v4(),
    } as WorkflowSpec;
    return this.workflowSpecRepository.createWorkflowSpec(workflowSpec);
  }

  async saveWorkflowSpec(id: string, saveWorkflowSpecInput: SaveWorkflowSpecInput) {
    const workflowSpecKey = {
      WSID: id,
    } as WorkflowSpecKey;
    const workflowSpec = {
      ...saveWorkflowSpecInput,
    } as WorkflowSpec;
    return this.workflowSpecRepository.saveWorkflowSpec(workflowSpecKey, workflowSpec);
  }

  async getWorkflowSpec(id: string) {
    const workflowSpecKey = {
      WSID: id,
    } as WorkflowSpecKey;
    return this.workflowSpecRepository.getWorkflowSpec(workflowSpecKey);
  }

  async deleteWorkflowSpec(id: string) {
    const workflowSpecKey = {
      WSID: id,
    } as WorkflowSpecKey;
    return this.workflowSpecRepository.deleteWorkflowSpec(workflowSpecKey);
  }

  async listWorkflowSpecs() {
    return this.workflowSpecRepository.listWorkflowSpecs();
  }
}
