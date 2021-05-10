import Workflow from '../workflow';
import { putRuleEB, putTargetsEB } from './event-bridge/event-bridge.util';
import { QUEUE_ERROR, WORKFLOW_QUEUE_URL, WORKFLOW_QUEUE_URL_ERROR } from './sqs/sqs-config.util';
import { createSQSQueue, getSQSQueueAttributes } from './sqs/sqs.util';

export default async function localStackInit() {
  const putRuleParams = {
    Name: Workflow.getRule(),
    EventPattern: JSON.stringify({
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
