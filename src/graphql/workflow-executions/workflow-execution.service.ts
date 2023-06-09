import { Inject, Injectable, Logger } from '@nestjs/common';

import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { WorkflowVersionService } from '../workflow-versions/workflow-version.service';

import { WorkflowExecStatus } from './workflow-execution.enum';
import { CreateWorkflowExecutionInput } from './inputs/post.inputs';
import {
  ListWorkflowExecutionsOfAnOrganizationInput,
  ListWorkflowExecutionsOfAVersionInput,
} from './inputs/get.inputs';
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

    let result: any = await this.workflowExecutionRepository.listWorkflowExecutionsOfAVersion(
      listWorkflowExecutionsOfAVersionInput,
    );

    result = result.map(async (res) => {
      const SK = res.WSXH_IDS.filter((wshx) => wshx.includes('HTTP'))[0];
      const WEB_SERVICE = SK
        ? (await this.workflowExecutionRepository.getWorkflowExecutionByKey({ PK: res.PK, SK: SK })).WEB_SERVICE
        : null;
      return { ...res, WEB_SERVICE: WEB_SERVICE };
    });

    return {
      WorkflowExecution: result,
      TotalRecords: workflowVersion.TotalEXC,
    };
  }

  async listWorkflowExecutionsOfAnOrganization(
    listWorkflowExecutionsOfAnOrganizationInput: ListWorkflowExecutionsOfAnOrganizationInput,
  ): Promise<ListWorkflowExecution> {
    const { OrgId } = listWorkflowExecutionsOfAnOrganizationInput;
    let result: any = await this.workflowExecutionRepository.listWorkflowExecutionsOfAnOrganization(
      listWorkflowExecutionsOfAnOrganizationInput,
    );

    return {
      TotalRecords: result.length,
      WorkflowExecution: result,
    };
  }
}
