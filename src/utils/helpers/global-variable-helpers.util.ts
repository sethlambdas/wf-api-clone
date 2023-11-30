import { GlobalVariableProps } from '../../graphql/common/interfaces/globalVariable.interface';

const reservedVariables = ['datetime_now'];

export function createGlobalVariableObject(globalVariables: GlobalVariableProps) {
  const gvObject = {};
  globalVariables.environmentValues.forEach((envValue) => {
    if (envValue.fieldName && envValue.fieldValue) {
      if (reservedVariables.includes(envValue.fieldName)) {
        gvObject[envValue.fieldName] = returnReservedVariableValue(envValue.fieldName);
      } else {
        gvObject[envValue.fieldName] = envValue.fieldValue;
      }
    }
  });
  return gvObject;
}

function returnReservedVariableValue(variableName: string) {
  switch (variableName) {
    case 'datetime_now':
      return new Date();
    // other reserved variables
    default:
      return new Date();
  }
}
