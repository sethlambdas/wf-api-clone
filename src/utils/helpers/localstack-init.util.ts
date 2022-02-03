import { ConfigUtil } from '@lambdascrew/utility';

import { deleteEventRule, putRuleEB, putTargetsEB } from '../../aws-services/event-bridge/event-bridge.util';
import {
  QUEUE_ERROR,
  QUEUE_NAME,
  WORKFLOW_QUEUE_URL,
  WORKFLOW_QUEUE_URL_ERROR,
} from '../../aws-services/sqs/sqs-config.util';
import { createSQSQueue, deleteQueue, getQueueURL, getSQSQueueAttributes } from '../../aws-services/sqs/sqs.util';
import Workflow from '../../workflow';

export default async function localStackInit() {
  const queue = await getQueueURL(QUEUE_NAME);

  if (queue) {
    await deleteEventRule(Workflow.getRule());
    await deleteQueue(WORKFLOW_QUEUE_URL_ERROR);
    await deleteQueue(WORKFLOW_QUEUE_URL);
  }

  const putRuleParams = {
    Name: Workflow.getRule(),
    EventPattern: JSON.stringify({
      'detail-type': [Workflow.getDetailType()],
      source: [Workflow.getSource()],
    }),
  };
  await putRuleEB(putRuleParams);

  const queueParamsError = {
    QueueName: QUEUE_ERROR,
  };

  await createSQSQueue(queueParamsError);

  const {
    Attributes: { QueueArn: queueArnError },
  } = await getSQSQueueAttributes(WORKFLOW_QUEUE_URL_ERROR);

  await createSQSQueue(null, queueArnError);

  const {
    Attributes: { QueueArn: queueArn },
  } = await getSQSQueueAttributes(WORKFLOW_QUEUE_URL);

  const putTargetsParams = {
    Rule: Workflow.getRule(),
    Targets: [{ Arn: queueArn, Id: '1' }],
  };
  await putTargetsEB(putTargetsParams);
}
