import { Logger } from '@nestjs/common';
import fetch from 'node-fetch';

const logger = new Logger('webService');

export default async function webService(payload: any, state?: any) {
  logger.log('Web Service Activity');
  try {
    if (!payload.Endpoint) {
      logger.error('No http/s endpoint specified.');
      throw new Error();
    }

    if (!payload.Name) {
      logger.error('No variable name specified.');
      throw new Error();
    }

    const apiResult = await fetch(payload.Endpoint);
    const data = await apiResult.json();
    return { [`${payload.Name}`]: data };
  } catch (err) {
    logger.log(err);
  }
}
