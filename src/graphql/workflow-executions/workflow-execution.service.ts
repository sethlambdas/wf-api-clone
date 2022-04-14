import { Inject, Injectable } from '@nestjs/common';

import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { WorkflowVersionService } from '../workflow-versions/workflow-version.service';

import { WorkflowExecStatus } from './workflow-execution.enum';
import { CreateWorkflowExecutionInput } from './inputs/post.inputs';
import { ListWorkflowExecutionsOfAVersionInput } from './inputs/get.inputs';
import { SaveWorkflowExecutionInput } from './inputs/put.inputs';
import { ListWorkflowExecution, WorkflowExecution } from './workflow-execution.entity';
import { WorkflowExecutionRepository } from './workflow-execution.repository';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    @Inject(WorkflowExecutionRepository)
    private workflowExecutionRepository: WorkflowExecutionRepository,
    private workflowVersionService: WorkflowVersionService,
  ) {}

  async createWorkflowExecution(createWorkflowExecutionInput: CreateWorkflowExecutionInput) {
    const { WorkflowVersionKeys } = createWorkflowExecutionInput;
    const inputs = { ...createWorkflowExecutionInput };

    // clean inputs
    delete inputs.WorkflowVersionKeys;

    const parentWorklowVersion = await this.workflowVersionService.getWorkflowVersionByKey(WorkflowVersionKeys);
    const newTotalEXC = parentWorklowVersion.TotalEXC + 1;

    await this.workflowVersionService.saveWorkflowVersion(WorkflowVersionKeys, { TotalEXC: newTotalEXC });

    const PK = this.workflowExecutionRepository.formWorkflowExecutionTablePK(WorkflowVersionKeys.SK, newTotalEXC);
    const SK = this.workflowExecutionRepository.formWorkflowExecutionTableSK(newTotalEXC);

    const workflowExecution = {
      PK,
      SK,
      ...inputs,
      STATUS: inputs.STATUS || WorkflowExecStatus.Running,
    } as WorkflowExecution;

    return this.workflowExecutionRepository.createWorkflowExecution(workflowExecution);
  }

  async saveWorkflowExecution(
    workflowExecutionKeysInput: CompositePrimaryKeyInput,
    saveWorkflowExecutionInput: SaveWorkflowExecutionInput,
  ) {
    const workflowExecution = {
      ...saveWorkflowExecutionInput,
    } as WorkflowExecution;
    return this.workflowExecutionRepository.saveWorkflowExecution(workflowExecutionKeysInput, workflowExecution);
  }

  async getWorkflowExecutionByKey(workflowExecutionKeysInput: CompositePrimaryKeyInput) {
    return this.workflowExecutionRepository.getWorkflowExecutionByKey(workflowExecutionKeysInput);
  }

  async deleteWorkflowExecution(workflowExecutionKeysInput: CompositePrimaryKeyInput) {
    return this.workflowExecutionRepository.deleteWorkflowExecution(workflowExecutionKeysInput);
  }

  async listWorkflowExecutionsOfAVersion(
    listWorkflowExecutionsOfAVersionInput: ListWorkflowExecutionsOfAVersionInput,
  ): Promise<ListWorkflowExecution> {
    const { WorkflowId, workflowVersionSK } = listWorkflowExecutionsOfAVersionInput;
    const workflowVersion = await this.workflowVersionService.getWorkflowVersionByKey({
      PK: WorkflowId,
      SK: workflowVersionSK,
    });

    if (!workflowVersion) return { Error: 'workflowVersion not existing' };

    listWorkflowExecutionsOfAVersionInput.TotalEXC = workflowVersion.TotalEXC;

    const result: any = await this.workflowExecutionRepository.listWorkflowExecutionsOfAVersion(
      listWorkflowExecutionsOfAVersionInput,
    );

    return {
      WorkflowExecution: result,
      TotalRecords: workflowVersion.TotalEXC,
    };
  }
}
