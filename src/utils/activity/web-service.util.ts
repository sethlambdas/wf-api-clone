import { Logger } from '@nestjs/common';
import fetch from 'node-fetch';

const logger = new Logger('webService');

export default async function webService(payload: any) {
  logger.log('Web Service Activity');
  try {
    if (!payload.endPoint) {
      logger.error('No http/s endpoint specified.');
      throw new Error();
    }
    const apiResult = await fetch(payload.endPoint);
    return await apiResult.json();
  } catch (err) {
    logger.log(err);
  }
}
