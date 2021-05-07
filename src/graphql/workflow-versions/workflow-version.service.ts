import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { WorkflowKeys } from '../common/interfaces/workflow-key.interface';
import { CreateWorkflowVersionInput } from './inputs/create-workflow-version.input';
import { GetAllWorkflowVersionsOfWorkflowInput } from './inputs/read-queries.inputs';
import { SaveWorkflowVersionInput } from './inputs/save-workflow-version.input';
import { WorkflowVersion } from './workflow-version.entity';
import { WorkflowVersionRepository } from './workflow-version.repository';

@Injectable()
export class WorkflowVersionService {
  constructor(
    @Inject(WorkflowVersionRepository)
    private workflowVersionRepository: WorkflowVersionRepository,
  ) {}

  async createWorkflowVersion(createWorkflowVersionInput: CreateWorkflowVersionInput) {
    const { PK, WLFID, CID, WV, FAID } = createWorkflowVersionInput;
    const WVID = v4();
    const workflowVersion = {
      PK,
      SK: `${WLFID}|WV#${WVID}`,
      WVID: `${WLFID}|WV#${WVID}`,
      CID,
      WV,
      FAID,
    } as WorkflowVersion;
    return this.workflowVersionRepository.createWorkflowVersion(workflowVersion);
  }

  async saveWorkflowVersion(workflowKeys: WorkflowKeys, saveWorkflowVersionInput: SaveWorkflowVersionInput) {
    const workflowVersion = {
      ...saveWorkflowVersionInput,
    } as WorkflowVersion;
    return this.workflowVersionRepository.saveWorkflowVersion(workflowKeys, workflowVersion);
  }

  async getAllWorkflowVersionsOfWorkflow(getAllWorkflowVersionsOfWorkflowInput: GetAllWorkflowVersionsOfWorkflowInput) {
    return await this.workflowVersionRepository.getAllWorkflowVersionsOfWorkflow(getAllWorkflowVersionsOfWorkflowInput);
  }

  async getWorkflowVersion(workflowKeys: WorkflowKeys) {
    return this.workflowVersionRepository.getWorkflowVersion(workflowKeys);
  }

  async queryWorkflowVersion(filter: { [key: string]: any }) {
    return this.workflowVersionRepository.queryWorkflowVersion(filter);
  }

  async deleteWorkflowVersion(workflowKeys: WorkflowKeys) {
    return this.workflowVersionRepository.deleteWorkflowVersion(workflowKeys);
  }

  async listWorkflowVersions() {
    return this.workflowVersionRepository.listWorkflowVersions();
  }
}
