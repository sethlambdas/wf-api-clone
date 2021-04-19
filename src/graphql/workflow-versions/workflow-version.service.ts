import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { CreateWorkflowVersionInput } from './inputs/create-workflow-version.input';
import { SaveWorkflowVersionInput } from './inputs/save-workflow-version.input';
import { WorkflowVersion, WorkflowVersionKey } from './workflow-version.entity';
import { WorkflowVersionRepository } from './workflow-version.repository';

@Injectable()
export class WorkflowVersionService {
  constructor(
    @Inject(WorkflowVersionRepository)
    private workflowVersionRepository: WorkflowVersionRepository,
  ) {}

  async createWorkflowVersion(createWorkflowVersionInput: CreateWorkflowVersionInput) {
    const workflowVersion = {
      ...createWorkflowVersionInput,
      WVID: v4(),
    } as WorkflowVersion;
    return this.workflowVersionRepository.createWorkflowVersion(workflowVersion);
  }

  async saveWorkflowVersion(id: string, saveWorkflowVersionInput: SaveWorkflowVersionInput) {
    const workflowVersionKey = {
      WVID: id,
    } as WorkflowVersionKey;
    const workflowVersion = {
      ...saveWorkflowVersionInput,
    } as WorkflowVersion;
    return this.workflowVersionRepository.saveWorkflowVersion(workflowVersionKey, workflowVersion);
  }

  async getWorkflowVersion(id: string) {
    const workflowVersionKey = {
      WVID: id,
    } as WorkflowVersionKey;
    return this.workflowVersionRepository.getWorkflowVersion(workflowVersionKey);
  }

  async queryWorkflowVersion(filter: { [key: string]: any }) {
    return this.workflowVersionRepository.queryWorkflowVersion(filter);
  }

  async deleteWorkflowVersion(id: string) {
    const workflowVersionKey = {
      WVID: id,
    } as WorkflowVersionKey;
    return this.workflowVersionRepository.deleteWorkflowVersion(workflowVersionKey);
  }

  async listWorkflowVersions() {
    return this.workflowVersionRepository.listWorkflowVersions();
  }
}
