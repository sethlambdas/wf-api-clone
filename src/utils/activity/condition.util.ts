import { Logger } from '@nestjs/common';
import { getMentionedData, resolveValueOfVariableFromState } from '../helpers/string-helpers.util';

const logger = new Logger('conditional');

export default async function condition(payload: any, state?: any) {
  logger.log('Conditional Activity');
  try {
    const { Choice, DefaultNext, WLFN, Operand } = payload;
    for (const choice of Choice) {
      const { Variable, Operator, RightHand, Next } = choice;

      if (!Variable) {
        logger.error('Invalid operation');
        throw new Error();
      }

      const stateVariable: any = getMentionedData(Variable, state);

      const evaluate = eval(`${stateVariable}`);
      logger.log('evaluation:', `${stateVariable}`);
      if (evaluate) {
        logger.log('Evaluate checked!', stateVariable);
        return Next;
      }
    }

    return DefaultNext;
  } catch (err) {
    logger.log('ERROR:');
    logger.log(err);
    return err;
  }
}
