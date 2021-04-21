import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { ActivityTypes } from '../../utils/activity/activity-registry.util';
import { putEventsEB } from '../../utils/event-bridge/event-bridge.util';
import { CreateWorkflowStepInput } from '../workflow-steps/inputs/create-workflow-step.input';
import { SaveWorkflowStepInput } from '../workflow-steps/inputs/save-workflow-step.input';
import { WorkflowStep } from '../workflow-steps/workflow-step.entity';
import { WorkflowStepService } from '../workflow-steps/workflow-step.service';
import { CreateWorkflowVersionInput } from '../workflow-versions/inputs/create-workflow-version.input';
import { SaveWorkflowVersionInput } from '../workflow-versions/inputs/save-workflow-version.input';
import { WorkflowVersionService } from '../workflow-versions/workflow-version.service';
import { CreateWorkflowInput } from './inputs/create-workflow.input';
import { DesignWorkflowInput } from './inputs/design-workflow.input';
import { StateWorkflowInput } from './inputs/state-workflow.input';

@Injectable()
export class WorkflowService {
  constructor(
    private workflowStepService: WorkflowStepService,
    private workflowVersionService: WorkflowVersionService,
  ) {}

  async createWorkflow(createWorkflowInput: CreateWorkflowInput) {
    const { WorkflowId, Design, StartAt, States } = createWorkflowInput;
    let WV = 1;

    if (WorkflowId) {
      const queryWorkflowVersions = await this.workflowVersionService.queryWorkflowVersion({
        WID: { eq: WorkflowId },
      });
      if (queryWorkflowVersions.length > 0) {
        WV = +queryWorkflowVersions[0].WV + 1;
      }
    }

    const activityTypesExists = States.every((state) => {
      return (Object as any).values(ActivityTypes).includes(state.ActivityType);
    });

    if (!activityTypesExists) {
      throw new Error('Not every activity type exists.');
    }

    const createWorkflowVersionInput: CreateWorkflowVersionInput = {
      CID: v4(),
      WID: v4(),
      WV: JSON.stringify(WV),
      FAID: '',
    };

    const workflowVersion = await this.workflowVersionService.createWorkflowVersion(createWorkflowVersionInput);
    const workflowSteps: WorkflowStep[] = [];

    for (const state of States) {
      const ACT = {
        T: state.ActivityType,
        NM: state.ActivityId,
        MD: state.Variables,
        END: state.End,
        DESIGN: this.getDesign(Design, state),
      };

      const createWorkflowStepInput: CreateWorkflowStepInput = {
        WVID: workflowVersion.WVID,
        NAID: '[]',
        AID: v4(),
        ACT: JSON.stringify(ACT),
      };

      const workflowStep = await this.workflowStepService.createWorkflowStep(createWorkflowStepInput);
      workflowSteps.push(workflowStep);
    }

    const nextStates = States.filter((state) => state.NextActivities?.length > 0);

    for (const state of nextStates) {
      const NAID = state.NextActivities.map((nextActivities) => {
        return workflowSteps.find((workflowStep) => {
          const ACT = JSON.parse(workflowStep.ACT);
          return ACT.NM === nextActivities;
        })?.AID;
      });

      const getWorkflowStep = workflowSteps.find((workflowStep) => {
        const ACT = JSON.parse(workflowStep.ACT);
        return ACT.NM === state.ActivityId;
      });

      const saveWorkflowStepInput: SaveWorkflowStepInput = {
        NAID: JSON.stringify(NAID),
      };

      await this.workflowStepService.saveWorkflowStep(getWorkflowStep.WSID, saveWorkflowStepInput);
    }

    await this.updateWorkflowStepsConditional(workflowSteps, States);

    const FAID = workflowSteps.find((workflowStep) => {
      const ACT = JSON.parse(workflowStep.ACT);
      return ACT.NM === StartAt;
    })?.AID;

    const saveWorkflowVersionInput: SaveWorkflowVersionInput = {
      FAID,
    };

    await this.workflowVersionService.saveWorkflowVersion(workflowVersion.WVID, saveWorkflowVersionInput);

    await this.executeWorkflowEB(FAID, workflowSteps);

    return workflowVersion.WID;
  }

  async updateWorkflowStepsConditional(workflowSteps: WorkflowStep[], States: StateWorkflowInput[]) {
    const conditionalStates = States.filter((state) => state.ActivityType === ActivityTypes.Condition);

    const getCurrentStepByNM = (value: string) => {
      return workflowSteps.find((workflowStep) => {
        const ACT = JSON.parse(workflowStep.ACT);
        return ACT.NM === value;
      });
    };

    for (const state of conditionalStates) {
      const DefaultNext = getCurrentStepByNM(state.Variables?.DefaultNext)?.AID;

      const getWorkflowStep = getCurrentStepByNM(state.ActivityId);

      const ACT = JSON.parse(getWorkflowStep.ACT);
      if (ACT.MD) {
        ACT.MD.DefaultNext = DefaultNext;

        ACT.MD.Choices = ACT.MD.Choices.map((choice) => {
          choice.Next = getCurrentStepByNM(choice.Next)?.AID;
          return choice;
        });
      }

      const saveWorkflowStepInput: SaveWorkflowStepInput = {
        ACT: JSON.stringify(ACT),
      };

      await this.workflowStepService.saveWorkflowStep(getWorkflowStep.WSID, saveWorkflowStepInput);
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

    const startEdge = Design.find((getDesign) => {
      return getDesign.source === startDesign.id;
    });

    if (startEdge.target === currentDesign.id) {
      design.push(startDesign);
      design.push(startEdge);
    }

    const endDesign = Design.find((getDesign) => {
      return getDesign?.data?.nodeType === 'End';
    });

    const endEdge = Design.find((getDesign) => {
      return getDesign.target === endDesign.id;
    });

    if (endEdge.source === currentDesign.id) {
      design.push(endDesign);
    }

    return design;
  }

  async executeWorkflowEB(FAID: string, workflowSteps: WorkflowStep[]) {
    if (!workflowSteps.length) {
      return;
    }

    const queryWorkflowSteps = await this.workflowStepService.queryWorkflowStep({
      AID: { eq: FAID },
    });

    if (!queryWorkflowSteps.length) {
      return;
    }

    const params = {
      Entries: [
        {
          Detail: JSON.stringify(queryWorkflowSteps[0]),
          DetailType: `workflowStep`,
          Source: 'workflow.initiate',
        },
      ],
    };

    await putEventsEB(params);
  }
}
