import { ConfigUtil } from '@lambdascrew/utility';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Response as Res } from 'express';
import * as moment from 'moment';
import { v4 } from 'uuid';

import {
  deleteEventRule,
  disableRule,
  enableRule,
  formCreateEventParams,
  putEventsEB,
  putRuleEB,
  putTargetsEB,
} from '../../aws-services/event-bridge/event-bridge.util';
import { WORKFLOW_QUEUE_URL } from '../../aws-services/sqs/sqs-config.util';
import { getSQSQueueAttributes } from '../../aws-services/sqs/sqs.util';
import { ActivityTypes, TriggerTypes } from '../../utils/activity/activity-registry.util';
import { resolveMentionedVariables } from '../../utils/activity/web-service.util';
import { ExternalActivityTypes } from '../../utils/external-activity/external-activities.util';
import { HttpTrigger, HttpTriggerEndpoint, IDetail, NetworkRequest } from '../../utils/workflow-types/details.types';
import Workflow from '../../workflow';

import { ACT as TypeACT, DesignWorkflowInput } from '../common/entities/workflow-step.entity';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';

import { CAT } from '../workflow-executions/workflow-execution.entity';
import { WorkflowExecStatus } from '../workflow-executions/workflow-execution.enum';

import { GetWorkflowStepByAidInput } from '../workflow-steps/inputs/get.inputs';
import { CreateWorkflowStepInput } from '../workflow-steps/inputs/post.inputs';
import { SaveWorkflowStepInput } from '../workflow-steps/inputs/put.inputs';
import { WorkflowStep } from '../workflow-steps/workflow-step.entity';

import { CreateWorkflowVersionInput } from '../workflow-versions/inputs/post.inputs';
import { SaveWorkflowVersionInput } from '../workflow-versions/inputs/put.inputs';

import { GetWorkflowByNameInput, GetWorkflowsOfAnOrgInput } from './inputs/get.inputs';
import { CreateWorkflowInput, InitiateAWorkflowStepInput } from './inputs/post.inputs';
import { SaveWorkflowInput, StateWorkflowInput } from './inputs/put.inputs';
import { CreateWorkflowResponse, GetWorkflowsOfAnOrg, Status, WorkflowModelRepository } from './workflow.entity';

import { OrganizationService } from '../organizations/organization.service';
import { WorkflowExecutionService } from '../workflow-executions/workflow-execution.service';
import { WorkflowStepService } from '../workflow-steps/workflow-step.service';
import { WorkflowVersionService } from '../workflow-versions/workflow-version.service';
import { WorkflowRepository } from './workflow.repository';
import { PaymentService } from '../../graphql/payments/payments.service';

@Injectable()
export class WorkflowService {
  private logger = new Logger('WorkflowService');

  constructor(
    @Inject(WorkflowRepository)
    private workflowRepository: WorkflowRepository,
    private workflowStepService: WorkflowStepService,
    private workflowVersionService: WorkflowVersionService,
    private workflowExecutionService: WorkflowExecutionService,
    private organizationService: OrganizationService,
    private paymentService: PaymentService,
  ) {}

  async createWorkflow(createWorkflowInput: CreateWorkflowInput): Promise<CreateWorkflowResponse> {
    const { WorkflowPK, Design, StartAt, States, WorkflowName, OrgId } = createWorkflowInput;
    let WV = 1;
    let FAID = '';
    let wlfPK = '';
    const workflowStepInputs: CreateWorkflowStepInput[] = [];
    let executeWorkflowStepKey: { PK: string; SK: string };
    const workflowNameAsSK = `WLF#${WorkflowName}`;

    if (WorkflowPK && WorkflowName) {
      const { TotalRecords } = await this.workflowVersionService.listAllWorkflowVersionsOfWorkflow({
        WorkflowPK,
        WorkflowName,
      });
      wlfPK = WorkflowPK;
      WV = TotalRecords + 1;
    } else {
      this.logger.log(`FINDING FOR ORGANIZATION: ${OrgId}`);
      const organization = await this.organizationService.getOrganization({ PK: OrgId });
      if (!organization) return { Error: 'Organization not existing' };

      const getWorkflowName = await this.workflowRepository.getWorkflowByName(
        OrgId,
        WorkflowName,
        organization.TotalWLFBatches,
      );
      if (getWorkflowName) return { IsWorkflowNameExist: true };

      this.logger.log(organization);
      const currentBatchWLFCount = await this.workflowRepository.getCurrentWorkflowsOfBatch(
        OrgId,
        organization.TotalWLFBatches,
      );
      let TotalWLFBatches = organization.TotalWLFBatches;

      if (currentBatchWLFCount.count >= ConfigUtil.get('workflow.batchLimit')) {
        TotalWLFBatches += 1;
        await this.organizationService.saveOrganization({ PK: OrgId, TotalWLFBatches });
      }

      this.logger.log('CREATING WORKFLOW');
      const httpTriggerState = States.find((state) => state.ActivityType === TriggerTypes.HTTP);
      let workflowTriggerId = '';

      if (httpTriggerState) {
        const httpUrlArr = httpTriggerState.Variables.Endpoint.split('/');
        workflowTriggerId = `WLF-UQ#${httpUrlArr[httpUrlArr.length - 1]}`;
      } else workflowTriggerId = `WLF-UQ#${v4()}`;

      const workflow = await this.workflowRepository.createWorkflow({
        OrgId,
        WorkflowName,
        WorkflowBatchNumber: TotalWLFBatches,
        FAID: '',
        UQ_OVL: workflowTriggerId,
        TriggerStatus: 'enabled',
      });

      this.logger.log('Workflow created');
      wlfPK = workflow.PK;
    }

    const activityTypesExists = States.every((state) => {
      return (Object as any)
        .values({ ...ActivityTypes, ...ExternalActivityTypes, ...TriggerTypes })
        .includes(state.ActivityType);
    });

    if (!activityTypesExists) throw new Error('Not every activity type exists.');

    this.logger.log('CREATING WORKFLOW VERSION');
    const createWorkflowVersionInput: CreateWorkflowVersionInput = {
      WorkflowPK: wlfPK,
      WorkflowName,
      CID: v4(),
      WV,
      FAID: '',
    };

    const workflowVersion = await this.workflowVersionService.createWorkflowVersion(createWorkflowVersionInput);
    for (const state of States) {
      const AID = state?.Variables?.AID || v4();

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
    await this.workflowRepository.saveWorkflow({ PK: wlfPK, SK: workflowNameAsSK }, { FAID });

    await this.executeWorkflowEB(
      OrgId,
      WorkflowName,
      { PK: wlfPK, SK: workflowNameAsSK },
      { PK: workflowVersion.PK, SK: workflowVersion.SK },
      executeWorkflowStepKey,
    );

    return {
      WorkflowKeys: {
        PK: wlfPK,
        SK: workflowNameAsSK,
      },
      WorkflowVersionKeys: {
        PK: workflowVersion.PK,
        SK: workflowVersion.SK,
      },
      WorkflowVersion: WV,
      IsWorkflowNameExist: false,
    };
  }

  async saveWorkflow(saveWorkflowInput: SaveWorkflowInput) {
    const key = {
      PK: saveWorkflowInput.PK,
      SK: saveWorkflowInput.SK,
    };
    delete saveWorkflowInput.PK;
    delete saveWorkflowInput.SK;
    if (saveWorkflowInput.TimeTriggerRuleName && saveWorkflowInput.STATUS === Status.DELETED) {
      await deleteEventRule(saveWorkflowInput.TimeTriggerRuleName);
    }
    return this.workflowRepository.saveWorkflow(key, saveWorkflowInput);
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

        ACT.MD.Choice = ACT.MD.Choice.map((choice) => {
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

    const currentEdges = Design.filter((getDesign) => {
      return getDesign.source === state.ActivityId;
    });

    if (!currentDesign || !currentEdges || !currentEdges.length) {
      return [];
    }

    const design = [currentDesign, ...currentEdges];

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
    workflowKeys: { PK: string; SK: string },
    workflowVersionsKeys: { PK: string; SK: string },
    executeWorkflowStepKey: { PK: string; SK: string },
  ) {
    const workflowStep = await this.workflowStepService.getWorkflowStepByKey(executeWorkflowStepKey);

    const params = formCreateEventParams({
      currentWorkflowStep: workflowStep,
      WLFN: WorkflowName,
      WorkflowVersionKeys: workflowVersionsKeys,
      OrgId,
    });

    await putEventsEB(params);

    for (const nextActId of workflowStep.NAID) {
      this.logger.log('Next Activity ID: ', nextActId);
      const getWorkflowStep = await this.workflowStepService.getWorkflowStepByAid({
        AID: nextActId,
        WorkflowStepPK: workflowStep.PK,
      });
      const getDetail = {
        currentWorkflowStep: getWorkflowStep,
        WLFN: WorkflowName,
        WorkflowVersionKeys: workflowVersionsKeys,
        OrgId,
        timedTrigger: { ACT: workflowStep.ACT, SK: workflowStep.SK },
      };
      if ((Object as any).values(TriggerTypes).includes(workflowStep.ACT.T)) {
        const { ScheduleType, RateValue, RateUnit, ExactTime, Cron } = workflowStep.ACT.MD;

        let Name: string;
        let ScheduleExpression: string;

        if (ScheduleType === 'Interval') {
          let rateExpression: string;
          if (RateUnit === 'Days') {
            rateExpression = `${RateValue} ${RateValue === '1' ? 'day' : 'days'}`;
          }
          if (RateUnit === 'Hours') {
            rateExpression = `${RateValue} ${RateValue === '1' ? 'hour' : 'hours'}`;
          }
          if (RateUnit === 'Minutes') {
            rateExpression = `${RateValue} ${RateValue === '1' ? 'minute' : 'minutes'}`;
          }

          Name = `Timed.${getWorkflowStep.SK.replace('#', '')}.Rule`;
          ScheduleExpression = `rate(${rateExpression})`;
        }

        if (ScheduleType === 'Cron') {
          Name = `Timed.${getWorkflowStep.SK.replace('#', '')}.Rule`;
          ScheduleExpression = `cron(${Cron})`;
        }

        if (ScheduleType === 'Exact') {
          const date = moment(ExactTime).utc();
          const hours = date.hours();
          const minutes = date.minutes();
          const dayOfMonth = date.date();
          const month = date.month() + 1;
          const year = date.year();

          Name = `Timed.${getWorkflowStep.SK.replace('#', '')}.Rule`;
          ScheduleExpression = `cron(${minutes} ${hours} ${dayOfMonth} ${month} ? ${year})`;
        }

        const putRuleParams = {
          Name,
          ScheduleExpression,
        };
        await putRuleEB(putRuleParams);

        this.workflowRepository.saveWorkflow(workflowKeys, { TimeTriggerRuleName: Name });

        const Id = '1';
        const {
          Attributes: { QueueArn: queueArn },
        } = await getSQSQueueAttributes(WORKFLOW_QUEUE_URL);
        const Arn = queueArn;
        const Input = JSON.stringify({
          delayedDetail: getDetail,
        });

        const putTargetsParams = {
          Rule: Name,
          Targets: [
            {
              Id,
              Arn,
              Input,
            },
          ],
        };

        await putTargetsEB(putTargetsParams);
      }
    }
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
      isRerun,
    } = initiateAWorkflowStepInput;

    const workflowStep = await this.workflowStepService.getWorkflowStepByKey(WorkflowStepKeys);

    let ManualApproval: any;

    if (ActivityType === ActivityTypes.ManualApproval) ManualApproval = { IsApprove: Approve };
    else ManualApproval = false;

    const params = formCreateEventParams({
      currentWorkflowStep: workflowStep,
      wfExecKeys: WorkflowExecutionKeys,
      WorkflowStepExecutionHistorySK,
      WLFN: WorkflowName,
      OrgId,
      isRerun,
      ManualApproval,
    });

    await putEventsEB(params);

    return 'Successfuly Initiated Event';
  }

  async getWorkflowByKey(workflowKeysInput: CompositePrimaryKeyInput) {
    return this.workflowRepository.getWorkflowByKey(workflowKeysInput);
  }

  async getWorkflowByName(getWorkflowByNameInput: GetWorkflowByNameInput): Promise<WorkflowModelRepository> {
    const { OrgId, WorkflowName } = getWorkflowByNameInput;

    const organization = await this.organizationService.getOrganization({ PK: OrgId });
    if (!organization)
      return {
        PK: '',
        SK: '',
        WLFN: '',
        DATA: '',
        FAID: '',
        STATUS: Status.INACTIVE,
        UQ_OVL: '',
        TriggerStatus: '',
        Error: 'Organization not existing',
      };

    const result = await this.workflowRepository.getWorkflowByName(OrgId, WorkflowName, organization.TotalWLFBatches);

    return result;
  }

  async getWorkflowOfAnOrg(getWorkflowsOfAnOrg: GetWorkflowsOfAnOrgInput): Promise<GetWorkflowsOfAnOrg> {
    const organization = await this.organizationService.getOrganization({ PK: getWorkflowsOfAnOrg.orgId });
    if (!organization) return { Error: 'Organization not existing' };

    const result = await this.workflowRepository.getWorkflowsOfAnOrg({
      ...getWorkflowsOfAnOrg,
      TotalWLFBatches: organization.TotalWLFBatches,
    });

    return { Workflows: result, TotalPages: getWorkflowsOfAnOrg.search ? 0 : organization.TotalWLFBatches };
  }

  async trigger(res: Res, params: string[], payload: any, req: any): Promise<any> {
    const { workflowId }: any = params;
    const endpoint: HttpTriggerEndpoint = {
      url: `${req.protocol}://${req.get('Host')}${req.originalUrl}`,
      method: req.method,
    };
    let reqBody: any;
    try {
      reqBody = JSON.parse(req.body.body);
    } catch (error) {
      reqBody = req.body.body;
    }
    const eventReqParams: NetworkRequest = {
      endpoint,
      headers: {
        ...req.headers,
        ...this.maskAuthorizationHeader(req.body.headers),
      },
      queryString: req.query,
      body: reqBody,
    };

    if (!workflowId) {
      const errorData = {
        result: 'failed',
        message: 'Workflow activity id does not exist.',
      };

      this.setResponseStatus(res, 500);

      this.setResponseData(res, errorData);

      return res;
    }

    const workflow = await this.workflowRepository.getWorkflowByUniqueKey({ UniqueKey: workflowId });
    // get workflow organization
    const org = await this.organizationService.getOrganization({ PK: workflow.PK.split('|')[0] });
    if (org) {
      const usageRecord = await this.paymentService.reportUsageRecord(org.subscriptionId);
      this.logger.log('Usage-record:', usageRecord);
    }

    if (workflow.TriggerStatus === 'disabled') {
      this.logger.log('Workflow trigger is disabled');
      const errorData = {
        result: 'failed',
        message: 'Workflow trigger is disabled',
      };

      this.setResponseStatus(res, 200);

      this.setResponseData(res, errorData);

      return res;
    }

    const getWorkflowStepByAidInput: GetWorkflowStepByAidInput = {
      AID: workflow.FAID,
      WorkflowStepPK: 'WV#',
    };
    const workflowStep = await this.workflowStepService.getWorkflowStepByAid(getWorkflowStepByAidInput);

    const paramsEB = {
      Entries: [],
    };

    let workflowExecutionPK = null;

    if (workflowStep.NAID.length > 0) {
      const workflowVersion = await this.workflowVersionService.getWorkflowVersionBySK({
        PK: 'ORG#',
        SK: workflowStep.PK,
      });

      const WSXH_SK = `WSXH|${workflowStep.ACT.MD.OrgId}|HTTP|${v4()}`;

      const wfExec = await this.workflowExecutionService.createWorkflowExecution({
        WorkflowVersionKeys: { PK: workflowVersion.PK, SK: workflowVersion.SK },
        STE: '{}',
        WSXH_IDS: [WSXH_SK],
        STATUS: WorkflowExecStatus.Running,
      });

      workflowExecutionPK = wfExec.PK;

      const httpACT: CAT = {
        T: workflowStep?.ACT.T,
        NM: workflowStep?.ACT.NM,
        MD: workflowStep?.ACT.MD,
        WSID: workflowStep.SK,
        Status: '',
      };

      const httpTrigger: HttpTrigger = {
        IsHttpTriggered: true,
        httpACT,
        HTTP_WSXH_SK: WSXH_SK,
        HTTP_workflowStepSK: workflowStep.SK,
        Body: payload,
        NetworkRequest: eventReqParams,
      };

      let i = 0;

      for (const nextActId of workflowStep.NAID) {
        this.logger.log('Next Activity ID: ', nextActId);
        const getWorkflowStep = await this.workflowStepService.getWorkflowStepByAid({
          AID: nextActId,
          WorkflowStepPK: workflowStep.PK,
        });

        const WorkflowPKSplit = workflowVersion.PK.split('|');
        const OrgId = WorkflowPKSplit[0];
        const detail: IDetail = {
          currentWorkflowStep: getWorkflowStep,
          WLFN: workflow.WLFN,
          WorkflowVersionKeys: {
            PK: workflowVersion.PK,
            SK: workflowVersion.SK,
          },
          wfExecKeys: {
            PK: wfExec.PK,
            SK: wfExec.SK,
          },
          OrgId,
          payload,
        };

        if (i === 0) {
          detail.httpTrigger = { ...httpTrigger };
          ++i;
        }

        paramsEB.Entries.push({
          Detail: JSON.stringify(detail),
          DetailType: Workflow.getDetailType(),
          Source: Workflow.getSource(),
        });
      }

      await putEventsEB(paramsEB);
    }

    const data = workflowStep?.ACT.MD;
    const status = data?.Status;
    const body = data?.Body;

    const result = resolveMentionedVariables(body, {
      data: payload,
    });

    this.setResponseHeaders(res, {
      'workflow-execution-key-pk': workflowExecutionPK,
    });

    this.setResponseStatus(res, status);

    this.setResponseData(res, result);

    return res;
  }

  async disableWorkflowTrigger(workflowKeysInput: CompositePrimaryKeyInput) {
    try {
      const workflow = await this.getWorkflowByKey(workflowKeysInput);

      await this.saveWorkflow({ ...workflowKeysInput, TriggerStatus: 'disabled' });
      if (workflow.TimeTriggerRuleName) {
        await disableRule({ Name: workflow.TimeTriggerRuleName });
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  async enableWorkflowTrigger(workflowKeysInput: CompositePrimaryKeyInput) {
    try {
      const workflow = await this.getWorkflowByKey(workflowKeysInput);

      await this.saveWorkflow({ ...workflowKeysInput, TriggerStatus: 'enabled' });
      if (workflow.TimeTriggerRuleName) {
        await enableRule({ Name: workflow.TimeTriggerRuleName });
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  private setResponseHeaders(res: Res, customHeaders: any) {
    const updatedCustomHeaders = customHeaders || {};
    return res.set({
      ...updatedCustomHeaders,
    });
  }

  private setResponseStatus(res: Res, customStatus: number) {
    const updatedCustomStatus = customStatus || 200;
    return res.status(updatedCustomStatus);
  }

  private setResponseData(res: Res, body: any) {
    let updatedBody = {};
    if (body) {
      if (typeof body === 'object') {
        updatedBody = body;
      } else {
        updatedBody = JSON.parse(body);
      }
    }
    return res.json({
      ...updatedBody,
    });
  }

  private maskAuthorizationHeader(header: any) {
    try {
      let maskedHeader = header;
      if (header.Authorization) {
        maskedHeader.Authorization = 'Bearer ****';
      }
      return maskedHeader;
    } catch (error) {
      return header;
    }
  }
}
