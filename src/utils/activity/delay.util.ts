import { Logger } from '@nestjs/common';
import moment from 'moment';
import { putRuleEB } from '../event-bridge/event-bridge.util';

const logger = new Logger('delay');

export default async function delay(payload: any, state?: any) {
  logger.log('Delay Activity');
  try {
    if (!payload.date) {
      logger.error('No date specified.');
      throw new Error();
    }

    const date = moment(payload.date);
    const minutes = payload.minute || 0;
    const hours = payload.hours || 0;
    const dayOfMonth = date.date();
    const month = date.month() + 1;
    const year = date.year();

    const source = `delay.secs${minutes}`;
    const putRuleParams = {
      Name: `Delay-${date}-Rule`,
      EventPattern: `{"source": ["${source}"]}`,
      ScheduleExpression: `cron(${minutes} ${hours} ${dayOfMonth} ${month} ? ${year})`,
    };
    await putRuleEB(putRuleParams);

    return source;
  } catch (err) {
    logger.log(err);
  }
}
