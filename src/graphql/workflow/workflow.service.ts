import { Injectable, Logger } from '@nestjs/common';
import { v4 } from 'uuid';
import { ActivityTypes } from '../../utils/activity/activity-registry.util';
import { putEventsEB } from '../../utils/event-bridge/event-bridge.util';
import { QueryWorkflowExecution, WorkflowExecution } from '../workflow-executions/workflow-execution.entity';
import { WorkflowExecutionService } from '../workflow-executions/workflow-execution.service';
import { CreateWorkflowStepInput } from '../workflow-steps/inputs/create-workflow-step.input';
import { SaveWorkflowStepInput } from '../workflow-steps/inputs/save-workflow-step.input';
import { ACT as TypeACT, DesignWorkflow, WorkflowStep } from '../workflow-steps/workflow-step.entity';
import { WorkflowStepService } from '../workflow-steps/workflow-step.service';
import { CreateWorkflowVersionInput } from '../workflow-versions/inputs/create-workflow-version.input';
import { SaveWorkflowVersionInput } from '../workflow-versions/inputs/save-workflow-version.input';
import { WorkflowVersionService } from '../workflow-versions/workflow-version.service';
import { CreateWorkflowInput } from './inputs/create-workflow.input';
import { DesignWorkflowInput } from './inputs/design-workflow.input';
import { GetWorkflowDetailsInput } from './inputs/get-workflow.input';
import { InitiateCurrentStepInput } from './inputs/initiate-step.input';
import { ListWorkflowInput } from './inputs/list-workflow.input';
import { StateWorkflowInput } from './inputs/state-workflow.input';
import { ListWorkflows, WorkflowDetails } from './workflow.entity';

@Injectable()
export class WorkflowService {
  private logger = new Logger('WorkflowService');

  constructor(
    private workflowStepService: WorkflowStepService,
    private workflowVersionService: WorkflowVersionService,
    private workflowExecutionService: WorkflowExecutionService,
  ) {}

  async createWorkflow(createWorkflowInput: CreateWorkflowInput) {
    const { WorkflowId, Design, StartAt, States, WLFN } = createWorkflowInput;
    let WV = 1;
    let WID = v4();

    if (WorkflowId) {
      WID = WorkflowId;
      const queryWorkflowVersions = await this.workflowVersionService.queryWorkflowVersion({
        WID: { eq: WorkflowId },
      });
      const length = queryWorkflowVersions.length;
      if (length > 0) {
        WV = +queryWorkflowVersions[length - 1].WV + 1;
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
      WID,
      WV: JSON.stringify(WV),
      FAID: '',
      WLFN,
    };

    const workflowVersion = await this.workflowVersionService.createWorkflowVersion(createWorkflowVersionInput);
    const workflowSteps: WorkflowStep[] = [];

    for (const state of States) {
      const ACT: TypeACT = {
        T: state.ActivityType,
        NM: state.ActivityId,
        MD: state.Variables,
        END: state.End,
        DESIGN: (await this.getDesign(Design, state)) as any,
      };

      const createWorkflowStepInput: CreateWorkflowStepInput = {
        WVID: workflowVersion.WVID,
        NAID: [],
        AID: v4(),
        ACT,
      };

      const workflowStep = await this.workflowStepService.createWorkflowStep(createWorkflowStepInput);
      workflowSteps.push(workflowStep);
    }

    const nextStates = States.filter((state) => state.NextActivities?.length > 0);

    for (const state of nextStates) {
      const NAID = state.NextActivities.map((nextActivityId) => {
        return workflowSteps.find((workflowStep) => {
          const ACT = workflowStep.ACT;
          return ACT.NM === nextActivityId;
        })?.AID;
      });

      const getWorkflowStep = workflowSteps.find((workflowStep) => {
        const ACT = workflowStep.ACT;
        return ACT.NM === state.ActivityId;
      });

      const saveWorkflowStepInput: SaveWorkflowStepInput = {
        NAID,
      };

      await this.workflowStepService.saveWorkflowStep(getWorkflowStep.WSID, saveWorkflowStepInput);
    }

    await this.updateWorkflowStepsConditional(workflowSteps, States);

    const FAID = workflowSteps.find((workflowStep) => {
      const ACT = workflowStep.ACT;
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

      const saveWorkflowStepInput: SaveWorkflowStepInput = {
        ACT,
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

  async getWorkflowDetails(getWorkflowDetailsInput: GetWorkflowDetailsInput): Promise<WorkflowDetails> {
    const { WID, WVID } = getWorkflowDetailsInput;
    let workflowVersionID = WVID;
    let workflowExecution: WorkflowExecution[];

    if (WVID) {
      workflowExecution = await this.workflowExecutionService.scanWorkflowExecution({
        WVID: workflowVersionID,
      });
    } else {
      try {
        let i = 0;

        const workflowVersions = await this.workflowVersionService.queryWorkflowVersion({
          WID,
        });

        workflowVersions.forEach((workflow) => {
          if (i > +workflow.WV) return;
          i = +workflow.WV;
          workflowVersionID = workflow.WVID;
        });

        workflowExecution = await this.workflowExecutionService.scanWorkflowExecution({
          WVID: workflowVersionID,
        });
      } catch (err) {
        this.logger.log('Something went wrong with query');
        this.logger.log('Query filters may not match anythin from database');
        return {};
      }
    }

    if (workflowExecution.length > 0) {
      const designs: DesignWorkflow[] = [];
      for (const activity of workflowExecution[0].CAT) {
        activity.DESIGN.forEach((element) => {
          designs.push(element);
        });
      }

      return {
        WID,
        WVID: workflowVersionID,
        ACTIVITIES: workflowExecution[0].CAT,
        DESIGN: designs,
      };
    }

    return {};
  }

  async initiateCurrentStep(initiateCurrentStepInput: InitiateCurrentStepInput) {
    const { WSID, ActivityType, Approve } = initiateCurrentStepInput;

    const queryWorkflowSteps = await this.workflowStepService.queryWorkflowStep({
      WSID: { eq: WSID },
    });

    if (!queryWorkflowSteps.length) return;

    if (ActivityType === ActivityTypes.ManualApproval && Approve) queryWorkflowSteps[0].ACT.MD.Completed = true;

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

    return 'Successfuly Initiated Event';
  }

  async listWorkflows(listWorkflowsInput: ListWorkflowInput): Promise<ListWorkflows> {
    const { CRAT, pageSize, LastKey, page } = listWorkflowsInput;
    let workflowExecutions: QueryWorkflowExecution = {
      Executions: [],
      totalRecords: 0,
    };

    workflowExecutions = await this.workflowExecutionService.queryIndexWorkflowExecution({
      IndexName: 'GetCRAT',
      PK: 'CRAT',
      Value: CRAT,
      pageSize,
      page,
      LastKey: LastKey || null,
    });

    const result: ListWorkflows = {
      Workflows: [],
      TotalRecords: workflowExecutions.totalRecords,
      LastKey: workflowExecutions.lastKey,
    };

    result.Workflows = workflowExecutions.Executions.map((e) => {
      return {
        WXID: e.WXID,
        WLFN: e.WLFN,
        CRAT: e.CRAT,
      };
    });

    return result;
  }
}
