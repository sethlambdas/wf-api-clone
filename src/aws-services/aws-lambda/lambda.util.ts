import { Logger } from '@nestjs/common';
import { EventRequestParams } from '../../utils/workflow-types/lambda.types';
import { Lambda } from './lambda.config.util';

const logger = new Logger('Lambda');

export const InvokeLambda = async (functionaName: string, eventReqPramas: EventRequestParams) => {
  logger.log(`Invoking lambda function ${functionaName} ...`);

  logger.log('EVENT REQUEST PARAMS');
  logger.log(eventReqPramas);
  try {
    const params = {
      FunctionName: functionaName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(eventReqPramas),
    };

    const response = await Lambda.invoke(params).promise();
    logger.log('============Lambda Invoke Result============');
    logger.log(response.Payload);
    logger.log('============Lambda Invoke Result============');

    return response.Payload;
  } catch (err) {
    logger.log(`Error, ${err}`);
  }
};
