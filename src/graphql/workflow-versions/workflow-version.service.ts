import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';

import { ACT as TypeACT, DesignWorkflow } from '../common/entities/workflow-step.entity';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { WorkflowStepService } from '../workflow-steps/workflow-step.service';

import { GetWorkflowVersionDetailsInput, ListAllWorkflowVersionsOfWorkflowInput } from './inputs/get.inputs';
import { CreateWorkflowVersionInput } from './inputs/post.inputs';
import { SaveWorkflowVersionInput } from './inputs/put.inputs';
import { ListWorkflowVersions, WorkflowVersion, WorkflowVersionDetails } from './workflow-version.entity';
import { WorkflowVersionRepository } from './workflow-version.repository';

@Injectable()
export class WorkflowVersionService {
  constructor(
    @Inject(WorkflowVersionRepository)
    private workflowVersionRepository: WorkflowVersionRepository,
    private workflowStepService: WorkflowStepService,
  ) {}

  async createWorkflowVersion(createWorkflowVersionInput: CreateWorkflowVersionInput) {
    const { WorkflowPK, WorkflowName, CID, WV, FAID } = createWorkflowVersionInput;
    const SK = this.workflowVersionRepository.formWorkflowVersionsTableSK(v4());
    const workflowVersion = {
      PK: this.workflowVersionRepository.formWorkflowVersionsTablePK(WorkflowPK, WorkflowName),
      SK,
      CID,
      WV,
      FAID,
      TotalEXC: 0,
      DATA: SK,
    } as WorkflowVersion;
    return this.workflowVersionRepository.createWorkflowVersion(workflowVersion);
  }

  async saveWorkflowVersion(
    workflowVersionKeysInput: CompositePrimaryKey,
    saveWorkflowVersionInput: SaveWorkflowVersionInput,
  ) {
    const workflowVersion = {
      ...saveWorkflowVersionInput,
    } as WorkflowVersion;
    return this.workflowVersionRepository.saveWorkflowVersion(workflowVersionKeysInput, workflowVersion);
  }

  async listAllWorkflowVersionsOfWorkflow(
    listAllWorkflowVersionsOfWorkflowInput: ListAllWorkflowVersionsOfWorkflowInput,
  ): Promise<ListWorkflowVersions> {
    const { workflowVersions, TotalRecords } = await this.workflowVersionRepository.listAllWorkflowVersionsOfWorkflow(
      listAllWorkflowVersionsOfWorkflowInput,
    );

    return {
      WorkflowVersions: workflowVersions,
      TotalRecords,
    };
  }

  async getWorkflowVersionByKey(workflowVersionKeysInput: CompositePrimaryKey) {
    return this.workflowVersionRepository.getWorkflowVersionByKey(workflowVersionKeysInput);
  }

  async getWorkflowVersionDetails(
    getWorkflowVersionDetailsInput: GetWorkflowVersionDetailsInput,
  ): Promise<WorkflowVersionDetails> {
    const { WorkflowVersionSK } = getWorkflowVersionDetailsInput;
    const Activities: TypeACT[] = [];
    const Design: DesignWorkflow[] = [];

    const workflowSteps = await this.workflowStepService.getWorkflowStepWithinAVersion(WorkflowVersionSK);

    for (const step of workflowSteps) {
      Activities.push(step.ACT);

      step.ACT.DESIGN.forEach((element) => {
        Design.push(element);
      });
    }

    return {
      WorkflowVersionSK,
      Activities,
      Design,
    };
  }

  async getWorkflowVersionBySK(key: CompositePrimaryKey): Promise<WorkflowVersion> {
    const result = await this.workflowVersionRepository.getWorkflowVersionBySK(key);
    return result[0];
  }

  async deleteWorkflowVersion(workflowVersionKeysInput: CompositePrimaryKey) {
    return this.workflowVersionRepository.deleteWorkflowVersion(workflowVersionKeysInput);
  }
}
