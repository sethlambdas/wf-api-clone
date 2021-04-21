import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { CreateWorkflowExecutionInput } from './inputs/create-workflow-execution.input';
import { SaveWorkflowExecutionInput } from './inputs/save-workflow-execution.input';
import { WorkflowExecution, WorkflowExecutionKey } from './workflow-execution.entity';
import { WorkflowExecutionRepository } from './workflow-execution.repository';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    @Inject(WorkflowExecutionRepository)
    private workflowExecutionRepository: WorkflowExecutionRepository,
  ) {}

  async createWorkflowExecution(createWorkflowExecutionInput: CreateWorkflowExecutionInput) {
    const workflowExecution = ({
      ...createWorkflowExecutionInput,
      WXID: v4(),
    } as unknown) as WorkflowExecution;
    return this.workflowExecutionRepository.createWorkflowExecution(workflowExecution);
  }

  async saveWorkflowExecution(id: string, saveWorkflowExecutionInput: SaveWorkflowExecutionInput) {
    const workflowExecutionKey = {
      WXID: id,
    } as WorkflowExecutionKey;
    const workflowExecution = {
      ...saveWorkflowExecutionInput,
    } as WorkflowExecution;
    return this.workflowExecutionRepository.saveWorkflowExecution(workflowExecutionKey, workflowExecution);
  }

  async getWorkflowExecution(id: string) {
    const workflowExecutionKey = {
      WXID: id,
    } as WorkflowExecutionKey;
    return this.workflowExecutionRepository.getWorkflowExecution(workflowExecutionKey);
  }

  async deleteWorkflowExecution(id: string) {
    const workflowExecutionKey = {
      WXID: id,
    } as WorkflowExecutionKey;
    return this.workflowExecutionRepository.deleteWorkflowExecution(workflowExecutionKey);
  }

  async queryWorkflowExecution(filter: { [key: string]: any }) {
    return this.workflowExecutionRepository.queryWorkflowExecution(filter);
  }

  async listWorkflowExecutions() {
    return this.workflowExecutionRepository.listWorkflowExecutions();
  }
}
