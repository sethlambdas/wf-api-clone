import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 } from 'uuid';
import { ActivityTypes } from '../../utils/activity/activity-registry.util';
import { putEventsEB } from '../../utils/event-bridge/event-bridge.util';
import { QueryListWFExecutions, WorkflowExecution } from '../workflow-executions/workflow-execution.entity';
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
import { CreateWorkflowResponse, ListWorkflows, WorkflowDetails } from './workflow.entity';
import { WorkflowRepository } from './workflow.repository';

@Injectable()
export class WorkflowService {
  private logger = new Logger('WorkflowService');

  constructor(
    @Inject(WorkflowRepository)
    private workflowRepository: WorkflowRepository,
    private workflowStepService: WorkflowStepService,
    private workflowVersionService: WorkflowVersionService,
    private workflowExecutionService: WorkflowExecutionService,
  ) {}

  async createWorkflow(createWorkflowInput: CreateWorkflowInput): Promise<CreateWorkflowResponse> {
    const { WorkflowId, Design, StartAt, States, WLFN, OrgId } = createWorkflowInput;
    let WV = 1;
    let WLFID = '';
    let FAID = '';
    const workflowStepInputs: CreateWorkflowStepInput[] = [];
    let executeWorkflowStepKey: { PK: string; SK: string };

    if (!WorkflowId) {
      const getWorkflowName = await this.workflowRepository.getWorkflowByName(WLFN, OrgId);
      if (getWorkflowName.count > 0) return { IsWorkflowNameExist: true };

      const workflow = await this.workflowRepository.createWorkflow({ OrgId, WLFN });
      WLFID = workflow.SK;
    } else {
      WLFID = WorkflowId;
      const workflowVersions = await this.workflowVersionService.getAllWorkflowVersionsOfWorkflow({ PK: OrgId, WLFID });
      WV = workflowVersions.count + 1;
    }

    const activityTypesExists = States.every((state) => {
      return (Object as any).values(ActivityTypes).includes(state.ActivityType);
    });

    if (!activityTypesExists) {
      throw new Error('Not every activity type exists.');
    }

    const createWorkflowVersionInput: CreateWorkflowVersionInput = {
      PK: OrgId,
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
        MD: state.Variables,
        DESIGN: await this.getDesign(Design, state),
      };

      if (state.End) ACT.END = state.End;

      const createWorkflowStepInput: CreateWorkflowStepInput = {
        PK: OrgId,
        WVID: workflowVersion.SK,
        NAID: [],
        AID,
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

    await this.updateWorkflowStepsConditional(workflowSteps, States);

    const saveWorkflowVersionInput: SaveWorkflowVersionInput = { FAID };

    await this.workflowVersionService.saveWorkflowVersion(
      { PK: OrgId, SK: workflowVersion.SK },
      saveWorkflowVersionInput,
    );

    await this.executeWorkflowEB(WLFN, executeWorkflowStepKey);

    return {
      PK: OrgId,
      SK: WLFID,
      IsWorkflowNameExist: false,
    };
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

  async executeWorkflowEB(WLFN: string, executeWorkflowStepKey: { PK: string; SK: string }) {
    const workflowStep = await this.workflowStepService.getWorkflowStep(executeWorkflowStepKey);

    const params = {
      Entries: [
        {
          Detail: JSON.stringify({
            ...workflowStep,
            WLFN,
          }),
          DetailType: `workflowStep`,
          Source: 'workflow.initiate',
        },
      ],
    };

    await putEventsEB(params);
  }

  async getWorkflowDetails(getWorkflowDetailsInput: GetWorkflowDetailsInput): Promise<WorkflowDetails> {
    const { OrgId, WorkflowVersionSK } = getWorkflowDetailsInput;
    const Activities: TypeACT[] = [];
    const Design: DesignWorkflow[] = [];

    const workflowSteps = await this.workflowStepService.getWorkflowStepWithinAVersion(OrgId, WorkflowVersionSK);

    for (const step of workflowSteps) {
      Activities.push(step.ACT);

      step.ACT.DESIGN.forEach((element) => {
        Design.push(element);
      });
    }

    return {
      PK: OrgId,
      WorkflowVersionSK,
      Activities,
      Design,
    };
  }

  async initiateCurrentStep(initiateCurrentStepInput: InitiateCurrentStepInput) {
    const { Key, ActivityType, Approve } = initiateCurrentStepInput;

    const queryWorkflowSteps = await this.workflowStepService.getWorkflowStep(Key);

    if (ActivityType === ActivityTypes.ManualApproval && Approve) queryWorkflowSteps.ACT.MD.Completed = true;

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
    let workflowExecutions: QueryListWFExecutions = {
      Executions: [],
      totalRecords: 0,
    };

    workflowExecutions = await this.workflowExecutionService.queryListWFExecutions({
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
        WLFN: 'hey',
        CRAT: e.CRAT,
      };
    });

    return result;
  }
}
