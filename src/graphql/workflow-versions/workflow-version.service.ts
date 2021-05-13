import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { ACT as TypeACT, DesignWorkflow } from '../common/entities/workflow-step.entity';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { WorkflowStepService } from '../workflow-steps/workflow-step.service';
import { CreateWorkflowVersionInput } from './inputs/create-workflow-version.input';
import { GetWorkflowVersionDetailsInput } from './inputs/get-workflow-version-details.input';
import { GetAllWorkflowVersionsOfWorkflowInput } from './inputs/read-queries.inputs';
import { SaveWorkflowVersionInput } from './inputs/save-workflow-version.input';
import { WorkflowVersion, WorkflowVersionDetails } from './workflow-version.entity';
import { WorkflowVersionRepository } from './workflow-version.repository';

@Injectable()
export class WorkflowVersionService {
  constructor(
    @Inject(WorkflowVersionRepository)
    private workflowVersionRepository: WorkflowVersionRepository,
    private workflowStepService: WorkflowStepService,
  ) {}

  async createWorkflowVersion(createWorkflowVersionInput: CreateWorkflowVersionInput) {
    const { WLFID, CID, WV, FAID } = createWorkflowVersionInput;
    const WVID = v4();
    const workflowVersion = {
      PK: WLFID,
      SK: `WV#${WVID}`,
      CID,
      WV,
      FAID,
      TotalEXC: 0,
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

  async getAllWorkflowVersionsOfWorkflow(getAllWorkflowVersionsOfWorkflowInput: GetAllWorkflowVersionsOfWorkflowInput) {
    return await this.workflowVersionRepository.getAllWorkflowVersionsOfWorkflow(getAllWorkflowVersionsOfWorkflowInput);
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

  async deleteWorkflowVersion(workflowVersionKeysInput: CompositePrimaryKey) {
    return this.workflowVersionRepository.deleteWorkflowVersion(workflowVersionKeysInput);
  }
}
