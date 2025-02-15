import { Logger } from '@nestjs/common';
import { startCase } from 'lodash';
import * as moment from 'moment';
import { putRuleEB, putTargetsEB } from '../../aws-services/event-bridge/event-bridge.util';
import { WORKFLOW_QUEUE_URL } from '../../aws-services/sqs/sqs-config.util';
import { getSQSQueueAttributes } from '../../aws-services/sqs/sqs.util';

const logger = new Logger('delay');

export default async function delay(payload: any, state?: any) {
  logger.log('Delay Activity');
  try {
    const { Date, Hours, Minutes } = payload;

    const getHours = +Hours || 0;
    const getMinutes = +Minutes || 0;
    const currentDate = moment().utc();
    const getDate = (Date && moment(Date).utc()) || currentDate;

    const date = getDate.add(getHours, 'hours').add(getMinutes, 'minutes');
    const timestamp = date.unix();
    const hours = date.hours();
    const minutes = date.minutes();
    const dayOfMonth = date.date();
    const month = date.month() + 1;
    const year = date.year();

    const source = `date.${timestamp}.hrs.${hours}.mins.${minutes}`;

    const Name = `Delay${startCase(source)}Rule`.replace(/\s/g, '');
    const EventPattern = `{"source": ["${source}"]}`;
    const ScheduleExpression = `cron(${minutes} ${hours} ${dayOfMonth} ${month} ? ${year})`;

    const putRuleParams = {
      Name,
      EventPattern,
      ScheduleExpression,
    };

    logger.log(putRuleParams);

    await putRuleEB(putRuleParams);

    const executeDelayEB = async (delayedDetail: any) => {
      const Id = '1';
      const {
        Attributes: { QueueArn: queueArn },
      } = await getSQSQueueAttributes(WORKFLOW_QUEUE_URL);
      const Arn = queueArn;
      const Input = JSON.stringify({
        delayedDetail,
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

      logger.log(putTargetsParams);

      await putTargetsEB(putTargetsParams);
    };

    return executeDelayEB;
  } catch (err) {
    logger.log(err);
  }
}
