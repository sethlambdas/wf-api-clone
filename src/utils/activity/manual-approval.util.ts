import { Logger } from '@nestjs/common';
import { ConfigUtil } from '../config.util';
import { mailgunSendEmail } from '../mailgun-helpers.util';
import { ActivityTypes } from './activity-registry.util';

const logger = new Logger('manualApproval');

export default async function manualApproval(payload: any, state?: any) {
  logger.log('Manual Approval Activity');
  try {
    const { Email } = payload;
    if (!Email) {
      logger.error('No email specified.');
      throw new Error();
    }
    const origin = ConfigUtil.get('server.origin');
    const executeManualApprovalEB = async (WLFN: string, WSID: string) => {
      const ActivityType = encodeURIComponent(ActivityTypes.ManualApproval);
      const approvalUrl = `${origin}?ActivityType=${ActivityType}&WSID=${WSID}`;
      const Subject = `APPROVAL NEEDED: Workflow "${WLFN}"`;
      const Body = `The following approval action is waiting for your response (Approve or Reject): ${approvalUrl}`;
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
