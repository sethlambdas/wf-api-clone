import { Inject, Injectable } from '@nestjs/common';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { WorkflowVersionService } from '../workflow-versions/workflow-version.service';
import { CreateWorkflowExecutionInput } from './inputs/create-workflow-execution.input';
import { ListWorkflowExecutionsOfAVersionInput } from './inputs/get-workflow-executions-of-version.input';
import { SaveWorkflowExecutionInput } from './inputs/save-workflow-execution.input';
import { WorkflowExecution } from './workflow-execution.entity';
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

    const PK = `${WorkflowVersionKeys.SK}|WX#${newTotalEXC}`;
    const SK = `WX#${newTotalEXC}`;

    const workflowExecution = {
      PK,
      SK,
      ...inputs,
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

  async listWorkflowExecutionsOfAVersion(listWorkflowExecutionsOfAVersionInput: ListWorkflowExecutionsOfAVersionInput) {
    return this.workflowExecutionRepository.listWorkflowExecutionsOfAVersion(listWorkflowExecutionsOfAVersionInput);
  }
}
