import { Logger } from '@nestjs/common';

const logger = new Logger('conditional');

export default async function condition(payload: any, state?: any) {
  logger.log('Conditional Activity');
  try {
    const { Choices, DefaultNext } = payload;
    for (const condition of Choices) {
      const { Variable, Operator, RightHand, Next } = condition;

      if (!Variable || !Operator || !RightHand) {
        logger.error('Invalid operation');
        throw new Error();
      }

      if (eval(`${Variable} ${Operator} ${RightHand}`)) {
        return Next;
      }
    }

    return DefaultNext;
  } catch (err) {
    logger.log(err);
  }
}
