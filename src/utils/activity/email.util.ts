import { Logger } from '@nestjs/common';
import { mailgunSendEmail } from '../mailgun-helpers.util';
import { replaceAt } from '../string-helpers.util';

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
  const regexBrackets = /{{(.*?)}}/gm;
  let updatedBody = Body;
  while (true) {
    const match = regexBrackets.exec(updatedBody);
    if (!match) {
      break;
    }
    const { 0: origWord, 1: word, index } = match;
    const lastIndex = index + origWord.length;
    const trimWord = word.trim();
    const replacement = (state && state[trimWord] && JSON.stringify(state[trimWord])) || '';
    updatedBody = replaceAt(updatedBody, index, lastIndex, replacement);
  }
  return updatedBody;
}
