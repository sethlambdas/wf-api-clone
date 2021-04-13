import { ConfigUtil } from './config.util';
import { putRuleEB, putTargetsEB } from './event-bridge/event-bridge.util';
import { createSQSQueue } from './sqs/sqs.util';

export default async function localStackInit() {
  const putRuleParams = {
    Name: 'SampleRule',
    EventPattern: '{"source": ["workflow.initiate"]}',
  };
  await putRuleEB(putRuleParams);

  await createSQSQueue();

  const putTargetsParams = {
    Rule: 'SampleRule',
    Targets: [{ Arn: `arn:aws:sqs:us-east-1:000000000000:${ConfigUtil.get('sqs.queueName')}`, Id: '1' }],
  };
  await putTargetsEB(putTargetsParams);
}
