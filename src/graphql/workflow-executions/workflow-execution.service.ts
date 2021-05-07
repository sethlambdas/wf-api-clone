import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { WorkflowKeysInput } from '../common/inputs/workflow-key.input';
import { CreateWorkflowExecutionInput } from './inputs/create-workflow-execution.input';
import { QueryListWFExecutionsInput } from './inputs/query-list-workflow-execution.input';
import { QueryWorkflowExecutionsInput } from './inputs/query-workflow-execution.input';
import { SaveWorkflowExecutionInput } from './inputs/save-workflow-execution.input';
import { WorkflowExecution } from './workflow-execution.entity';
import { WorkflowExecutionRepository } from './workflow-execution.repository';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    @Inject(WorkflowExecutionRepository)
    private workflowExecutionRepository: WorkflowExecutionRepository,
  ) {}

  async createWorkflowExecution(createWorkflowExecutionInput: CreateWorkflowExecutionInput) {
    const { WVID } = createWorkflowExecutionInput;

    const inputs = { ...createWorkflowExecutionInput };

    delete inputs.WVID;

    const WXID = `${WVID}|WX#${v4()}`;

    const workflowExecution = ({
      SK: WXID,
      ...inputs,
    } as unknown) as WorkflowExecution;
    return this.workflowExecutionRepository.createWorkflowExecution(workflowExecution);
  }

  async saveWorkflowExecution(
    workflowKeysInput: WorkflowKeysInput,
    saveWorkflowExecutionInput: SaveWorkflowExecutionInput,
  ) {
    const workflowExecution = {
      ...saveWorkflowExecutionInput,
    } as WorkflowExecution;
    return this.workflowExecutionRepository.saveWorkflowExecution(workflowKeysInput, workflowExecution);
  }

  async getWorkflowExecution(workflowKeysInput: WorkflowKeysInput) {
    return this.workflowExecutionRepository.getWorkflowExecution(workflowKeysInput);
  }

  async deleteWorkflowExecution(workflowKeysInput: WorkflowKeysInput) {
    return this.workflowExecutionRepository.deleteWorkflowExecution(workflowKeysInput);
  }

  async scanWorkflowExecution(filter: { [key: string]: any }) {
    return this.workflowExecutionRepository.scanWorkflowExecution(filter);
  }

  async queryWorkflowExecution(queryWorkflowExecutionsInput: QueryWorkflowExecutionsInput) {
    return this.workflowExecutionRepository.queryWorkflowExecution(queryWorkflowExecutionsInput);
  }

  async listWorkflowExecutions() {
    return this.workflowExecutionRepository.listWorkflowExecutions();
  }

  async queryListWFExecutions(queryListWFExecutionsInput: QueryListWFExecutionsInput) {
    return this.workflowExecutionRepository.queryListWFExecutions(queryListWFExecutionsInput);
  }
}
