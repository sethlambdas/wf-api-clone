import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';

import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { WorkflowVersionService } from '../workflow-versions/workflow-version.service';
import { WorkflowService } from '../workflow/workflow.service';

import { CreateWorkflowStepExecutionHistoryInput } from './inputs/post.inputs';
import { ListAllManualApprovalInput, ListWorkflowStepExecutionHistoryOfAnExecutionInput } from './inputs/get.inputs';
import { SaveWorkflowStepExecutionHistoryInput } from './inputs/put.inputs';
import {
  GetAllManualApproval,
  ListAllManualApprovalResponse,
  ListWorkflowStepExecutionHistory,
  WorkflowStepExecutionHistory,
} from './workflow-steps-wxh.entity';
import { WorkflowStepExecutionHistoryRepository } from './workflow-steps-wxh.repository';

@Injectable()
export class WorkflowStepExecutionHistoryService {
  constructor(
    @Inject(WorkflowStepExecutionHistoryRepository)
    private workflowStepExecutionHistoryRepository: WorkflowStepExecutionHistoryRepository,
    private workflowService: WorkflowService,
    private workflowVersionService: WorkflowVersionService,
  ) {}

  async createWorkflowStepExecutionHistory(
    createWorkflowStepExecutionHistoryInput: CreateWorkflowStepExecutionHistoryInput,
  ) {
    const { OrgId, SK, T, WorkflowStepSK } = createWorkflowStepExecutionHistoryInput;
    const inputs = {
      ...createWorkflowStepExecutionHistoryInput,
      WSID: WorkflowStepSK,
    };

    delete inputs.WorkflowStepSK;
    delete inputs.OrgId;

    const workflowStepExecutionHistory = {
      ...inputs,
    } as WorkflowStepExecutionHistory;

    if (!SK) {
      const ActivityType = T.replace(' ', '');
      workflowStepExecutionHistory.SK = `WSXH|${OrgId}|${ActivityType}|${v4()}`;
    }

    return this.workflowStepExecutionHistoryRepository.createWorkflowStepExecutionHistory(workflowStepExecutionHistory);
  }

  async saveWorkflowStepExecutionHistory(
    workflowStepExecutionHistoryKeyInput: CompositePrimaryKeyInput,
    saveWorkflowStepExecutionHistoryInput: SaveWorkflowStepExecutionHistoryInput,
  ) {
    const workflowStepExecutionHistory = {
      ...saveWorkflowStepExecutionHistoryInput,
    } as WorkflowStepExecutionHistory;
    return this.workflowStepExecutionHistoryRepository.saveWorkflowStepExecutionHistory(
      workflowStepExecutionHistoryKeyInput,
      workflowStepExecutionHistory,
    );
  }

  async getWorkflowStepExecutionHistoryByKey(key: CompositePrimaryKeyInput) {
    return this.workflowStepExecutionHistoryRepository.getWorkflowStepExecutionHistoryByKey(key);
  }

  async listAllManualApproval(
    listAllManualApprovalInput: ListAllManualApprovalInput,
  ): Promise<ListAllManualApprovalResponse> {
    const manualApprovals: GetAllManualApproval[] = [];
    const { results, TotalRecords } = await this.workflowStepExecutionHistoryRepository.listAllManualApproval(
      listAllManualApprovalInput,
    );

    for (const data of results) {
      const entityIds = data.PK.split('|', 2);
      const workflowVersionSK = entityIds[0];
      const workflow = await this.workflowService.getWorkflowByName({
        WorkflowName: data.WLFN,
        OrgId: listAllManualApprovalInput.OrgId,
      });

      const workflowVersion = await this.workflowVersionService.getWorkflowVersionByKey({
        PK: workflow.PK,
        SK: workflowVersionSK,
      });

      manualApprovals.push({
        WorkflowExecutionKeys: {
          PK: data.PK,
          SK: entityIds[1],
        },
        WorkflowStepKeys: {
          PK: workflowVersionSK,
          SK: data.WSID,
        },
        WorkflowStepExecutionHistorySK: data.SK,
        WorkflowName: workflow.WLFN,
        WorkflowVersion: workflowVersion.WV,
        Email: data.MD.Email,
      });
    }

    return {
      ManualApprovals: manualApprovals,
      LastKey: JSON.stringify(results.lastKey),
      TotalRecords,
    };
  }

  async listWorkflowStepExecutionHistoryOfAnExecution(
    listWorkflowStepExecutionHistoryOfAnExecutionInput: ListWorkflowStepExecutionHistoryOfAnExecutionInput,
  ): Promise<ListWorkflowStepExecutionHistory> {
    const { workflowStepExecutionHistories, TotalRecords } =
      await this.workflowStepExecutionHistoryRepository.listAllWorkflowStepExecutionHistoryOfAnExecution(
        listWorkflowStepExecutionHistoryOfAnExecutionInput,
      );

    return {
      WorkflowStepExecutionHistory: workflowStepExecutionHistories,
      TotalRecords,
    };
  }

  async deleteWorkflowStepExecutionHistory(workflowStepExecutionHistoryKeyInput: CompositePrimaryKeyInput) {
    return this.workflowStepExecutionHistoryRepository.deleteWorkflowStepExecutionHistory(
      workflowStepExecutionHistoryKeyInput,
    );
  }
}
