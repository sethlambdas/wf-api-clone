import { Logger } from '@nestjs/common';

import { getMentionedData } from '../helpers/string-helpers.util';

const logger = new Logger('assignData');

export default async function assignData(payload: any, state?: any) {
  logger.log('AssignData Activity');
  try {
    const { CustomVariables } = payload;
    const fieldValues: any[] = (CustomVariables && JSON.parse(CustomVariables)) || [];

    const result = {};
    for (const keyValue of fieldValues) {
      logger.log(keyValue);
      Object.keys(keyValue).forEach((key) => {
        result[key] = getMentionedData(keyValue[key], state)
      });
    }

    return result;
  } catch (err) {
    logger.log(err);
  }
}
