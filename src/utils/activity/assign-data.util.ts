import { Logger } from '@nestjs/common';

const logger = new Logger('assignData');

export default async function assignData(payload: any, state?: any) {
  logger.log('AssignData Activity');
  try {
    const { FieldValues } = payload;
    const fieldValuesData = (FieldValues && JSON.parse(FieldValues)) || {};
    const assignDataObject = {};
    for (const fieldValueKey in fieldValuesData) {
      if (fieldValuesData.hasOwnProperty(fieldValueKey)) {
        const fieldValueData = fieldValuesData[fieldValueKey];
        const fieldName = fieldValueData.fieldName;
        const fieldValue = fieldValueData.fieldValue;
        assignDataObject[fieldName] = fieldValue;
      }
    }
    return assignDataObject;
  } catch (err) {
    logger.log(err);
  }
}
