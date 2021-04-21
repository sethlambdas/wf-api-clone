import { Logger } from '@nestjs/common';
const logger = new Logger('email');

export default async function manualInput(payload: any, state?: any) {
  logger.log('Manual Input Activity');
  try {
    if (payload.Completed) {
      const { variables } = payload;
      return variables;
    }
  } catch (err) {
    logger.log(err);
  }
}
