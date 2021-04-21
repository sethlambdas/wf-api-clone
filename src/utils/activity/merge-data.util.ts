import { Logger } from '@nestjs/common';

const logger = new Logger('mergeData');

export default async function mergeData(payload: any, state?: any) {
  logger.log('Merge Data Activity');
  try {
    const { StoreVariable, JoinValues } = payload;
    const values = JoinValues.split(',');
    const storeArray = [];

    for (const value of values) {
      storeArray.push(state[`${value}`]);
    }

    return { [`${StoreVariable}`]: storeArray };
  } catch (err) {
    logger.log(err);
  }
}
