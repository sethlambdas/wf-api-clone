import { Logger } from '@nestjs/common';

const logger = new Logger('conditional');

export default async function conditional(payload: any, state?: any) {
  logger.log('Conditional Activity');
  try {
    const { variable, operator, rightHand, data } = payload;
    if (!variable || !operator || !rightHand) {
      logger.error('Invalid operation');
      throw new Error();
    }

    if (eval(`${data[variable]} ${operator} ${rightHand}`)) {
      return true;
    }
    return false;
  } catch (err) {
    logger.log(err);
  }
}
