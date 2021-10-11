import { CAT } from 'src/graphql/workflow-executions/workflow-execution.entity';
import { CompositePrimaryKey } from '../../graphql/common/interfaces/workflow-key.interface';
import { WorkflowStep } from '../../graphql/workflow-steps/workflow-step.entity';

export interface IDetail {
  httpTrigger?: HttpTrigger;

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
}

export interface HttpTrigger {
  IsHttpTriggered: boolean;
  httpACT: CAT;
  HTTP_WSXH_SK: string;
  HTTP_workflowStepSK: string;
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
