import { Logger } from '@nestjs/common';
import { mapValues } from 'lodash';
import { stringify } from 'query-string';
import { ConfigUtil } from '../config.util';
import { mailgunSendEmail } from '../mailgun-helpers.util';
import { ActivityTypes } from './activity-registry.util';

const logger = new Logger('manualApproval');

export interface ManualApprovalEmailParams {
  WorkflowExecutionKeyPK: string;
  WorkflowExecutionKeySK: string;
  WorkflowStepKeyPK: string;
  WorkflowStepKeySK: string;
  WorkflowStepExecutionHistorySK: string;
  WorkflowPK: string;
  WorkflowVersionSK: string;
  WorkflowVersion: string;
  WorkflowName: string;
  OrgId: string;
}

export default async function manualApproval(payload: any, state?: any) {
  logger.log('Manual Approval Activity');
  try {
    const { Email } = payload;
    if (!Email) {
      logger.error('No email specified.');
      throw new Error();
    }
    const origin = ConfigUtil.get('server.origin');
    const executeManualApprovalEB = async (manualApprovalEmailParams: ManualApprovalEmailParams) => {
      const ActivityType = encodeURIComponent(ActivityTypes.ManualApproval);
      const mapManualApprovalEmailParams = mapValues(manualApprovalEmailParams, (value) => {
        return encodeURIComponent(value);
      });
      const searchParams = {
        ...mapManualApprovalEmailParams,
        ActivityType,
      };
      const searchString = stringify(searchParams);
      const approvalUrl = `${origin}/designer/getDesign?${searchString}`;
      const workflowName = decodeURIComponent(mapManualApprovalEmailParams.WorkflowName);
      const workflowVersion = decodeURIComponent(mapManualApprovalEmailParams.WorkflowVersion);
      const Subject = `APPROVAL NEEDED: Workflow "${workflowName}"`;
      const Body = getManualApprovalEmailBody(workflowName, workflowVersion, approvalUrl);
      const manualApprovalPayload = {
        Email,
        Subject,
        Body,
      };
      await mailgunSendEmail(manualApprovalPayload);
      logger.log(`Email for approval sent to ${Email}`);
    };
    return executeManualApprovalEB;
  } catch (err) {
    logger.log(err);
  }
}

export const getManualApprovalEmailBody = (workflowName: string, workflowVersion: string, approvalUrl: string) => {
  return `
    <b>Workflow Name</b><br/>
    <p>${workflowName}</p>
    <b>Workflow Version</b><br/>
    <p>${workflowVersion}</p>
    <b>Approval Details</b><br/>
    <p>The following approval action is waiting for your response (Approve or Reject): ${approvalUrl}</p>
  `;
};
