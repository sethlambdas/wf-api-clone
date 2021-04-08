import { Inject, Injectable } from '@nestjs/common';
import { WorkflowSpec, WorkflowSpecKey } from './workflow-spec.interface';
import { WorkflowSpecRepository } from './workflow-spec.repository';

@Injectable()
export class WorkflowSpecService {
  constructor(
    @Inject(WorkflowSpecRepository)
    private workflowSpecRepository: WorkflowSpecRepository,
  ) {}

  async createWorkflowSpec(workflowSpec: WorkflowSpec) {
    return this.workflowSpecRepository.createWorkflowSpec(workflowSpec);
  }

  async saveWorkflowSpec(key: WorkflowSpecKey, workflowSpec: Partial<WorkflowSpec>) {
    return this.workflowSpecRepository.saveWorkflowSpec(key, workflowSpec);
  }

  async getWorkflowSpec(key: WorkflowSpecKey) {
    return this.workflowSpecRepository.getWorkflowSpec(key);
  }

  async listWorkflowSpecs() {
    return this.workflowSpecRepository.listWorkflowSpecs();
  }
}
