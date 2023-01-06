import { Logger } from '@nestjs/common';
import { resolveValueOfVariableFromState } from '../helpers/string-helpers.util';

const logger = new Logger('conditional');

export default async function condition(payload: any, state?: any) {
  logger.log('Conditional Activity');
  try {
    const { Choice, DefaultNext, WLFN } = payload;
    for (const choice of Choice) {
      const { Variable, Operator, RightHand, Next } = choice;

      if (!Variable || !Operator || !RightHand) {
        logger.error('Invalid operation');
        throw new Error();
      }
      
      const stateVariable: any = resolveValueOfVariableFromState(Variable, state);

      const variableData = (isNaN(stateVariable) && JSON.stringify(stateVariable)) || stateVariable;
      const rightHandData = (isNaN(RightHand) && JSON.stringify(RightHand)) || RightHand;
      const evaluate = eval(`'${variableData}' ${Operator} '${rightHandData}'`);

      if (evaluate) return Next;
    }

    return DefaultNext;
  } catch (err) {
    logger.log('ERROR:');
    logger.log(err);
    return err;
  }
}
