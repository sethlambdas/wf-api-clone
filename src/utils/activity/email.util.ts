import { Logger } from '@nestjs/common';
import { mailgunSendEmail } from '../mailgun-helpers.util';

const logger = new Logger('email');

export default async function email(payload: any) {
  logger.log('Email Activity');
  try {
    if (!payload.Email) {
      logger.error('No email specified.');
      throw new Error();
    }
    await mailgunSendEmail(payload.Email);
    logger.log(`Email sent to ${payload.Email}`);
  } catch (err) {
    logger.log(err);
  }
}
