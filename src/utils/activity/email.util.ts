import { Logger } from '@nestjs/common';
import { mailgunSendEmail } from '../helpers/mailgun-helpers.util';
import { getMentionedData, replaceAt } from '../helpers/string-helpers.util';

const logger = new Logger('email');

export default async function email(payload: any, state?: any) {
  logger.log('Email Activity');
  try {
    const { Email, Body } = payload;
    if (!Email) {
      logger.error('No email specified.');
      throw new Error();
    }
    payload.Body = emailMarkupBody(Body, state);
    await mailgunSendEmail(payload);
    logger.log(`Email sent to ${Email}`);
  } catch (err) {
    logger.log(err);
  }
}

export function emailMarkupBody(Body: string, state?: any) {
  if (!Body) {
    return '';
  }
  let updatedBody = getMentionedData(Body,state);
  logger.log('updated body',updatedBody)
  return updatedBody;
}
