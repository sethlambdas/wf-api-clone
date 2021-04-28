import { Logger } from '@nestjs/common';

const logger = new Logger('conditional');

export default async function condition(payload: any, state?: any) {
  logger.log('Conditional Activity');
  try {
    const { Choices, DefaultNext } = payload;
    for (const choice of Choices) {
      const { Variable, Operator, RightHand, Next } = choice;

      if (!Variable || !Operator || !RightHand) {
        logger.error('Invalid operation');
        throw new Error();
      }

      const stateVariable = (state && state[Variable]) || '';
      const variableData = (isNaN(stateVariable) && JSON.stringify(stateVariable)) || stateVariable;
      const rightHandData = (isNaN(RightHand) && JSON.stringify(RightHand)) || RightHand;
      const evaluate = eval(`${variableData} ${Operator} ${rightHandData}`);

      if (evaluate) {
        return Next;
      }
    }

    return DefaultNext;
  } catch (err) {
    logger.log(err);
  }
}
