import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { WorkflowKeysInput } from '../common/inputs/workflow-key.input';
import { CreateWorkflowStepInput } from './inputs/create-workflow-step.input';
import { SaveWorkflowStepInput } from './inputs/save-workflow-step.input';
import { WorkflowStep } from './workflow-step.entity';
import { WorkflowStepRepository } from './workflow-step.repository';

@Injectable()
export class WorkflowStepService {
  constructor(
    @Inject(WorkflowStepRepository)
    private workflowStepRepository: WorkflowStepRepository,
  ) {}

  async createWorkflowStep(createWorkflowStepInput: CreateWorkflowStepInput) {
    const { PK, WVID, NAID, AID, ACT } = createWorkflowStepInput;
    const WSID = `${WVID}|WS#${v4()}`;
    const transformedAID = `AID#${AID}`;
    const workflowStep = {
      PK,
      SK: WSID,
      AID: transformedAID,
      DATA: transformedAID,
      WSID,
      WVID,
      NAID,
      ACT,
    } as WorkflowStep;
    return this.workflowStepRepository.createWorkflowStep(workflowStep);
  }

  async batchCreateWorkflowStep(createWorkflowStepInputs: CreateWorkflowStepInput[]) {
    const workflowSteps: WorkflowStep[] = [];
    for (const input of createWorkflowStepInputs) {
      const { PK, WVID, NAID, AID, ACT } = input;
      const WSID = `${WVID}|WS#${v4()}`;
      const transformedAID = `AID#${AID}`;
      const workflowStep = {
        PK,
        SK: WSID,
        AID: transformedAID,
        DATA: transformedAID,
        WSID,
        WVID,
        NAID,
        ACT,
      } as WorkflowStep;
      workflowSteps.push(workflowStep);
    }

    const { unprocessedItems } = await this.workflowStepRepository.batchCreateWorkflowStep(workflowSteps);
    if (unprocessedItems.length > 0) return false;
    else return workflowSteps;
  }

  async saveWorkflowStep(workflowKeysInput: WorkflowKeysInput, saveWorkflowStepInput: SaveWorkflowStepInput) {
    const workflowStep = {
      ...saveWorkflowStepInput,
    } as WorkflowStep;
    return this.workflowStepRepository.saveWorkflowStep(workflowKeysInput, workflowStep);
  }

  async getWorkflowStep(workflowKeysInput: WorkflowKeysInput) {
    return this.workflowStepRepository.getWorkflowStep(workflowKeysInput);
  }

  async getWorkflowStepByAid(AID: string, OrgId: string) {
    return this.workflowStepRepository.getWorkflowStepByAid(AID, OrgId);
  }

  async getWorkflowStepWithinAVersion(OrgId: string, WorkflowVersionSK: string) {
    return this.workflowStepRepository.getWorkflowStepWithinAVersion(OrgId, WorkflowVersionSK);
  }

  async queryWorkflowStep(filter: { [key: string]: any }) {
    return this.workflowStepRepository.queryWorkflowStep(filter);
  }

  async deleteWorkflowStep(workflowKeysInput: WorkflowKeysInput) {
    return this.workflowStepRepository.deleteWorkflowStep(workflowKeysInput);
  }

  async listWorkflowSteps() {
    return this.workflowStepRepository.listWorkflowSteps();
  }
}
