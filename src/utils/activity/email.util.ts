import { Logger } from '@nestjs/common';
import { mailgunSendEmail } from '../mailgun-helpers.util';

const logger = new Logger('email');

export default async function email(payload: any) {
  logger.log('Email Activity');
  try {
    const { Email } = payload;
    if (!Email) {
      logger.error('No email specified.');
      throw new Error();
    }
    await mailgunSendEmail(payload);
    logger.log(`Email sent to ${Email}`);
  } catch (err) {
    logger.log(err);
  }
}
