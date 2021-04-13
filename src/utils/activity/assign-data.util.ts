import { Logger } from '@nestjs/common';

const logger = new Logger('assignData');

export default async function assignData(payload: any) {
  logger.log('AssignData Activity');
  try {
    const { variables } = payload;
    return variables;
  } catch (err) {
    logger.log(err);
  }
}
