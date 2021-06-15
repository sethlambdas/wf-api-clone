import { WorkflowStep } from '../../graphql/workflow-steps/workflow-step.entity';
import { CompositePrimaryKey } from '../../graphql/common/interfaces/workflow-key.interface';

export interface IDetail {
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

export interface ExternalServiceDetails {
  // Defines External service status
  isDone: boolean;

  // Defines External service result/output
  results: WorkflowStepResults;
}

export interface WorkflowStepResults {
  // Get Email Attachments result
  s3LinkAttachments: string[];
}

export interface IManualApproval {
  // Workflow Step Approval
  IsApprove: boolean;
}
