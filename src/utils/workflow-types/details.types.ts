import { WorkflowStepStatus } from '../../graphql/workflow-steps/enums/workflow-step-status.enum';
import { CompositePrimaryKey } from '../../graphql/common/interfaces/workflow-key.interface';
import { CAT } from '../../graphql/workflow-executions/workflow-execution.entity';
import { WorkflowStep } from '../../graphql/workflow-steps/workflow-step.entity';
import { EventRequestParams } from './lambda.types';

export interface IDetail {
  isRerun?: boolean;

  httpTrigger?: HttpTrigger;

  timedTrigger?: any;

  OrgId: string;

  WLFN: string;

  currentWorkflowStep: WorkflowStep;

  externalServiceDetails?: ExternalServiceDetails;

  previousStepResults?: WorkflowStepResults;

  WorkflowVersionKeys?: CompositePrimaryKey;

  wfExecKeys?: CompositePrimaryKey;

  WorkflowStepExecutionHistorySK?: string;

  ManualApproval?: IManualApproval;

  parallelIndex?: number;

  parallelIndexes?: number[];

  payload?: any;

  loopConfig?: ILoopConfig;

  parentWSXH?: {
    keys: CompositePrimaryKey;
    nextParentWSXHParams: EventParams;
    state?: any;
  };
}

export interface EventParams {
  Entries: {
    Detail: string;
    DetailType: string;
    Source: string;
  }[];
}

export interface HttpTrigger {
  IsHttpTriggered: boolean;
  httpACT: CAT;
  HTTP_WSXH_SK: string;
  HTTP_workflowStepSK: string;
  Status?: WorkflowStepStatus;
  Body?: string;
  NetworkRequest?: NetworkRequest;
  ParentWLFN?: string;
}

export interface NetworkRequest {
  endpoint: HttpTriggerEndpoint;
  headers: any;
  queryString: any;
  body: any;
}

export interface HttpTriggerEndpoint {
  url: string;
  method: string;
}

export interface ExternalServiceDetails {
  // Defines External service status
  isDone: boolean;

  // Defines External service result/output
  results: WorkflowStepResults;
}

export interface WorkflowStepResults {
  // Get Email Attachments result
  files: { name: string; url: string }[];
}

export interface IManualApproval {
  // Workflow Step Approval
  IsApprove: boolean;
}

export interface ILoopConfig {
  Name: string;
  index?: string;
  maxLoop: number;
  currentLoop: number;
  firstLoopActivity: CompositePrimaryKey;
}
