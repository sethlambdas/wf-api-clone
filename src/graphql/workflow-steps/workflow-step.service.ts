import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 } from 'uuid';

import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';

import { CreateWorkflowStepInput } from './inputs/post.inputs';
import { GetWorkflowStepByAidInput } from './inputs/get.inputs';
import { SaveWorkflowStepInput } from './inputs/put.inputs';
import { WorkflowStep } from './workflow-step.entity';
import { WorkflowStepRepository } from './workflow-step.repository';

@Injectable()
export class WorkflowStepService {
  constructor(
    @Inject(WorkflowStepRepository)
    private workflowStepRepository: WorkflowStepRepository,
  ) {}

  async createWorkflowStep(createWorkflowStepInput: CreateWorkflowStepInput) {
    const { WorkflowVersionSK, NAID, AID, ACT } = createWorkflowStepInput;
    const WSID = `WS#${v4()}`;
    const transformedAID = `AID#${AID}`;
    const workflowStep = {
      PK: WorkflowVersionSK,
      SK: WSID,
      AID: transformedAID,
      DATA: transformedAID,
      NAID,
      ACT,
    } as WorkflowStep;
    return this.workflowStepRepository.createWorkflowStep(workflowStep);
  }

  /*
    just remove the FileTypeOption if value is null
  */
  removeFileTypeOption(dataArray) {
    const newArray = [...dataArray];
    newArray.forEach((item) => {
      if (item.data) {
        if (typeof item.data.variables?.FileTypeOption !== 'undefined') {
          if (!item.data.variables?.FileTypeOption) {
            delete item.data.variables.FileTypeOption;
          }
        }
      }
    });

    return newArray;
  }

  async batchCreateWorkflowStep(createWorkflowStepInputs: CreateWorkflowStepInput[]) {
    const workflowSteps: WorkflowStep[] = [];
    for (const input of createWorkflowStepInputs) {
      const { WorkflowVersionSK, NAID, AID, ACT } = input;
      const workflowStepSK = `WS#${v4()}`;
      const transformedAID = `AID#${AID}`;
      const modifiedMD = ACT?.MD || null;
      // just remove the FileTypeOption if value is null
      if (modifiedMD) {
        if (!modifiedMD?.FileTypeOption) delete modifiedMD.FileTypeOption;
      }
      Logger.log('modifiedMD', this.removeFileTypeOption(ACT.DESIGN));
      const workflowStep = {
        PK: WorkflowVersionSK,
        SK: workflowStepSK,
        AID: transformedAID,
        DATA: transformedAID,
        NAID,
        ACT: {
          ...ACT,
          DESIGN: [...this.removeFileTypeOption(ACT.DESIGN)],
          MD: { ...modifiedMD },
        },
      } as WorkflowStep;
      workflowSteps.push(workflowStep);
    }
    Logger.log('batchCreateWorkflowStep:', workflowSteps);
    const { unprocessedItems } = await this.workflowStepRepository.batchCreateWorkflowStep(workflowSteps);
    Logger.log('unprocessedItems|||:', unprocessedItems);
    if (unprocessedItems.length > 0) return false;
    else return workflowSteps;
  }

  async saveWorkflowStep(
    workflowStepsKeysInput: CompositePrimaryKeyInput,
    saveWorkflowStepInput: SaveWorkflowStepInput,
  ) {
    const workflowStep = {
      ...saveWorkflowStepInput,
    } as WorkflowStep;
    return this.workflowStepRepository.saveWorkflowStep(workflowStepsKeysInput, workflowStep);
  }

  async getWorkflowStepByKey(workflowStepsKeysInput: CompositePrimaryKeyInput) {
    return this.workflowStepRepository.getWorkflowStepByKey(workflowStepsKeysInput);
  }

  async getWorkflowStepByAid(getWorkflowStepByAidInput: GetWorkflowStepByAidInput): Promise<WorkflowStep> {
    const result = await this.workflowStepRepository.getWorkflowStepByAid(getWorkflowStepByAidInput);
    return result[0];
  }

  async getWorkflowStepWithinAVersion(WorkflowVersionSK: string) {
    return this.workflowStepRepository.getWorkflowStepWithinAVersion(WorkflowVersionSK);
  }

  async deleteWorkflowStep(workflowStepsKeysInput: CompositePrimaryKeyInput) {
    return this.workflowStepRepository.deleteWorkflowStep(workflowStepsKeysInput);
  }
}
