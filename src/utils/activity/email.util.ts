import { Logger } from '@nestjs/common';
import { mailgunSendEmail } from '../mailgun-helpers.util';

const logger = new Logger('email');

export default async function email(payload: any) {
  logger.log('Email Activity');
  try {
    if (!payload.email) {
      logger.error('No email specified.');
      throw new Error();
    }
    await mailgunSendEmail(payload.email);
    logger.log(`Email sent to ${payload.email}`);
  } catch (err) {
    logger.log(err);
  }
}
