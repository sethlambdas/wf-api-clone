import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 } from 'uuid';
import { ActivityTypes } from '../../utils/activity/activity-registry.util';
import { putEventsEB } from '../../utils/event-bridge/event-bridge.util';
import Workflow from '../../workflow';
import { ACT as TypeACT, DesignWorkflowInput } from '../common/entities/workflow-step.entity';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { OrganizationService } from '../organizations/organization.service';
import { CreateWorkflowStepInput } from '../workflow-steps/inputs/create-workflow-step.input';
import { SaveWorkflowStepInput } from '../workflow-steps/inputs/save-workflow-step.input';
import { WorkflowStep } from '../workflow-steps/workflow-step.entity';
import { WorkflowStepService } from '../workflow-steps/workflow-step.service';
import { CreateWorkflowVersionInput } from '../workflow-versions/inputs/create-workflow-version.input';
import { SaveWorkflowVersionInput } from '../workflow-versions/inputs/save-workflow-version.input';
import { WorkflowVersionService } from '../workflow-versions/workflow-version.service';
import { CreateWorkflowInput } from './inputs/create-workflow.input';
import { GetWorkflowByNameInput } from './inputs/get-workflow-by-name.input';
import { InitiateAWorkflowStepInput } from './inputs/initiate-step.input';
import { StateWorkflowInput } from './inputs/state-workflow.input';
import { CreateWorkflowResponse } from './workflow.entity';
import { WorkflowRepository } from './workflow.repository';

@Injectable()
export class WorkflowService {
  private logger = new Logger('WorkflowService');

  constructor(
    @Inject(WorkflowRepository)
    private workflowRepository: WorkflowRepository,
    private workflowStepService: WorkflowStepService,
    private workflowVersionService: WorkflowVersionService,
    private organizationService: OrganizationService,
  ) {}

  async createWorkflow(createWorkflowInput: CreateWorkflowInput): Promise<CreateWorkflowResponse> {
    const { WorkflowId, Design, StartAt, States, WorkflowName, OrgId } = createWorkflowInput;
    let WV = 1;
    let WLFID = '';
    let FAID = '';
    const workflowStepInputs: CreateWorkflowStepInput[] = [];
    let executeWorkflowStepKey: { PK: string; SK: string };

    if (!WorkflowId) {
      const getWorkflowName = await this.getWorkflowByName({ WorkflowName, OrgId });
      if (getWorkflowName) return { IsWorkflowNameExist: true };

      const organization = await this.organizationService.getOrganization({ PK: OrgId });
      if (!organization) return { Error: 'Organization not existing' };
      await this.organizationService.saveOrganization({ PK: OrgId }, { TotalWLF: organization.TotalWLF + 1 });

      const workflow = await this.workflowRepository.createWorkflow({
        OrgId,
        WorkflowName,
        WorkflowNumber: organization.TotalWLF,
      });
      WLFID = workflow.PK;
    } else {
      WLFID = WorkflowId;
      const workflowVersions = await this.workflowVersionService.getAllWorkflowVersionsOfWorkflow({
        WorkflowPK: WLFID,
      });
      WV = workflowVersions.count + 1;
    }

    const activityTypesExists = States.every((state) => {
      return (Object as any).values(ActivityTypes).includes(state.ActivityType);
    });

    if (!activityTypesExists) {
      throw new Error('Not every activity type exists.');
    }

    const createWorkflowVersionInput: CreateWorkflowVersionInput = {
      WLFID,
      CID: v4(),
      WV: JSON.stringify(WV),
      FAID: '',
    };

    const workflowVersion = await this.workflowVersionService.createWorkflowVersion(createWorkflowVersionInput);

    for (const state of States) {
      const AID = v4();

      if (state.ActivityId === StartAt) FAID = `AID#${AID}`;

      const ACT: TypeACT = {
        T: state.ActivityType,
        NM: state.ActivityId,
        DESIGN: await this.getDesign(Design, state),
      };

      if (state.Variables) ACT.MD = state.Variables;
      if (state.End) ACT.END = state.End;

      const createWorkflowStepInput: CreateWorkflowStepInput = {
        WorkflowVersionSK: workflowVersion.SK,
        AID,
        NAID: [],
        ACT,
      };

      workflowStepInputs.push(createWorkflowStepInput);
    }

    const results = await this.workflowStepService.batchCreateWorkflowStep(workflowStepInputs);

    if (!results) throw new Error('Not all workflow steps inserted in DynamoDB');

    const workflowSteps = results;

    const nextStates = States.filter((state) => state.NextActivities?.length > 0);

    for (const state of nextStates) {
      const NAID: string[] = [];
      let getWorkflowStep: WorkflowStep;

      for (const step of workflowSteps) {
        if (state.NextActivities.includes(step.ACT.NM)) {
          NAID.push(step.AID);
          step.NAID = NAID;
        }

        if (step.ACT.NM === state.ActivityId) getWorkflowStep = step;
        if (step.AID === FAID) executeWorkflowStepKey = { PK: step.PK, SK: step.SK };
      }

      const saveWorkflowStepInput: SaveWorkflowStepInput = { NAID };
      await this.workflowStepService.saveWorkflowStep(
        { PK: getWorkflowStep.PK, SK: getWorkflowStep.SK },
        saveWorkflowStepInput,
      );
    }

    if (!executeWorkflowStepKey) {
      for (const step of workflowSteps) if (step.AID === FAID) executeWorkflowStepKey = { PK: step.PK, SK: step.SK };
    }

    await this.updateManualApprovalNextSteps(workflowSteps, States);
    await this.updateWorkflowStepsConditional(workflowSteps, States);

    const saveWorkflowVersionInput: SaveWorkflowVersionInput = { FAID };

    await this.workflowVersionService.saveWorkflowVersion(
      { PK: workflowVersion.PK, SK: workflowVersion.SK },
      saveWorkflowVersionInput,
    );

    await this.executeWorkflowEB(
      OrgId,
      WorkflowName,
      { PK: workflowVersion.PK, SK: workflowVersion.SK },
      executeWorkflowStepKey,
    );

    return {
      WorkflowKeys: {
        PK: WLFID,
        SK: WLFID.split('|', 2)[1],
      },
      WorkflowVersionKeys: {
        PK: workflowVersion.PK,
        SK: workflowVersion.SK,
      },
      IsWorkflowNameExist: false,
    };
  }

  async updateManualApprovalNextSteps(workflowSteps: WorkflowStep[], States: StateWorkflowInput[]) {
    const manualApprovalStates = States.filter((state) => state.ActivityType === ActivityTypes.ManualApproval);

    for (const state of manualApprovalStates) {
      let ApproveStep = '';
      let RejectStep = '';
      let currentStep: WorkflowStep;

      for (const step of workflowSteps) {
        if (step.ACT.NM === state.ActivityId) currentStep = step;
        if (step.ACT.NM === state.Variables.ApproveStep) ApproveStep = step.AID;
        if (step.ACT.NM === state.Variables.RejectStep) RejectStep = step.AID;
      }
      const ACT = currentStep.ACT;
      if (ACT.MD) {
        if (ApproveStep !== '') ACT.MD.ApproveStep = ApproveStep;
        if (RejectStep !== '') ACT.MD.RejectStep = RejectStep;

        if (ApproveStep !== '' || RejectStep !== '') {
          const saveWorkflowStepInput: SaveWorkflowStepInput = { ACT };

          await this.workflowStepService.saveWorkflowStep(
            { PK: currentStep.PK, SK: currentStep.SK },
            saveWorkflowStepInput,
          );
        }
      }
    }
  }

  async updateWorkflowStepsConditional(workflowSteps: WorkflowStep[], States: StateWorkflowInput[]) {
    const conditionalStates = States.filter((state) => state.ActivityType === ActivityTypes.Condition);

    const getCurrentStepByNM = (value: string) => {
      return workflowSteps.find((workflowStep) => {
        const ACT = workflowStep.ACT;
        return ACT.NM === value;
      });
    };

    for (const state of conditionalStates) {
      const DefaultNext = getCurrentStepByNM(state.Variables?.DefaultNext)?.AID;

      const getWorkflowStep = getCurrentStepByNM(state.ActivityId);

      const ACT = getWorkflowStep.ACT;
      if (ACT.MD) {
        ACT.MD.DefaultNext = DefaultNext;

        ACT.MD.Choices = ACT.MD.Choices.map((choice) => {
          choice.Next = getCurrentStepByNM(choice.Next)?.AID;
          return choice;
        });
      }

      const saveWorkflowStepInput: SaveWorkflowStepInput = { ACT };

      await this.workflowStepService.saveWorkflowStep(
        { PK: getWorkflowStep.PK, SK: getWorkflowStep.SK },
        saveWorkflowStepInput,
      );
    }
  }

  async getDesign(Design: DesignWorkflowInput[], state: StateWorkflowInput) {
    if (!Design) {
      return [];
    }

    const currentDesign = Design.find((getDesign) => {
      return getDesign.id === state.ActivityId;
    });

    const currentEdge = Design.find((getDesign) => {
      return getDesign.source === state.ActivityId;
    });

    if (!currentDesign || !currentEdge) {
      return [];
    }

    const design = [currentDesign, currentEdge];

    const startDesign = Design.find((getDesign) => {
      return getDesign?.data?.nodeType === 'Start';
    });

    if (startDesign) {
      const startEdge = Design.find((getDesign) => {
        return getDesign.source === startDesign.id;
      });

      if (startEdge.target === currentDesign.id) {
        design.push(startDesign);
        design.push(startEdge);
      }
    }

    const endDesign = Design.find((getDesign) => {
      return getDesign?.data?.nodeType === 'End';
    });

    if (endDesign) {
      const endEdge = Design.find((getDesign) => {
        return getDesign.target === endDesign.id;
      });

      if (endEdge.source === currentDesign.id) {
        design.push(endDesign);
      }
    }

    return design;
  }

  async executeWorkflowEB(
    OrgId: string,
    WorkflowName: string,
    workflowVerionsKeys: { PK: string; SK: string },
    executeWorkflowStepKey: { PK: string; SK: string },
  ) {
    const workflowStep = await this.workflowStepService.getWorkflowStepByKey(executeWorkflowStepKey);

    const params = {
      Entries: [
        {
          Detail: JSON.stringify({
            ...workflowStep,
            WLFN: WorkflowName,
            WorkflowVersionKeys: workflowVerionsKeys,
            OrgId,
          }),
          DetailType: Workflow.getDetailType(),
          Source: Workflow.getSource(),
        },
      ],
    };

    await putEventsEB(params);
  }

  async initiatAWorkflowStep(initiateAWorkflowStepInput: InitiateAWorkflowStepInput) {
    const {
      WorkflowExecutionKeys,
      WorkflowStepExecutionHistorySK,
      WorkflowStepKeys,
      OrgId,
      WorkflowName,
      ActivityType,
      Approve,
    } = initiateAWorkflowStepInput;

    const workflowStep = await this.workflowStepService.getWorkflowStepByKey(WorkflowStepKeys);

    let ManualApproval: any;

    if (ActivityType === ActivityTypes.ManualApproval) ManualApproval = { IsApprove: Approve };
    else ManualApproval = false;

    const detail = {
      ...workflowStep,
      wfExecKeys: WorkflowExecutionKeys,
      WorkflowStepExecutionHistorySK,
      WLFN: WorkflowName,
      OrgId,
      ManualApproval,
    };

    const params = {
      Entries: [
        {
          Detail: JSON.stringify(detail),
          DetailType: Workflow.getDetailType(),
          Source: Workflow.getSource(),
        },
      ],
    };

    await putEventsEB(params);

    return 'Successfuly Initiated Event';
  }

  async getWorkflowByKey(workflowKeysInput: CompositePrimaryKeyInput) {
    return this.workflowRepository.getWorkflowByKey(workflowKeysInput);
  }

  async getWorkflowByName(getWorkflowByNameInput: GetWorkflowByNameInput) {
    const result = await this.workflowRepository.getWorkflowByName(getWorkflowByNameInput);
    return result[0];
  }
}
