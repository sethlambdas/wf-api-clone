import { Logger } from '@nestjs/common';

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

      const stateVariable: any = resolvedVariableField(WLFN, Variable, state);

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

const resolvedVariableField = (WLFN: string, Variable: string, state: any) => {
  if (!Variable) return '';

  const { data } = state;

  const regexBrackets = new RegExp(/{{(.*?)}}/gm);

  const match = regexBrackets.exec(Variable);

  if (!match) return;

  const { 1: word } = match;
  const trimWord = word.trim();

  let workflowNameArr = WLFN.split(' ');
  workflowNameArr = workflowNameArr.filter((value) => {
    return value !== '' ? true : false;
  })
  const workflowName = workflowNameArr.join('_');

  let fields: string[];
  let dataValue: any;

  if (word.includes(`${workflowName}.payload`)) {
    fields = trimWord.split('payload.')[1].split('.');
    dataValue = { ...data };
  }
  else {
    fields = trimWord.split('.');
    dataValue = { ...state };
    delete dataValue.data;
  }

  fields.forEach((fieldName) => {
    Variable = dataValue[fieldName];
    dataValue = dataValue[fieldName];
  });

  return Variable;
}
