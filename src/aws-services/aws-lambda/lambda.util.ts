import { Logger } from '@nestjs/common';
import { EventRequestParams } from '../../utils/workflow-types/lambda.types';
import { Lambda } from './lambda.config.util';
import { UploadFileToS3 } from '../s3/s3.util';

export interface NetWorkClientResponse {
  statusCode: number;
  headers: any;
  body: any;
  downloadedFileLink?: string;
}

const logger = new Logger('Lambda');

export const InvokeLambda = async (
  functionaName: string,
  eventReqPramas: EventRequestParams,
  webServiceDownloadFile: boolean,
  targetFileName?: string,
): Promise<NetWorkClientResponse> => {
  logger.log(`Invoking lambda function ${functionaName} ...`);

  logger.log('EVENT REQUEST PARAMS');
  logger.log(eventReqPramas);
  try {
    const params = {
      FunctionName: functionaName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(eventReqPramas),
    };

    const response: any = await Lambda.invoke(params).promise();
    logger.log('============Lambda Invoke Result============');
    logger.log(response.Payload);
    logger.log('============Lambda Invoke Result============');

    if (!!webServiceDownloadFile) {
      const result = JSON.parse(response.Payload as any);
      const url = await UploadFileToS3(Buffer.from(result.body.data), targetFileName);

      result.body = [{ url, name: targetFileName }];

      const specialResponse = JSON.stringify({ ...result });

      return specialResponse as any;
    }

    return response.Payload as NetWorkClientResponse;
  } catch (err) {
    logger.log(`Error, ${err}`);
  }
};

interface AddApiGatewayLambdaPermissionProps {
  FunctionName: string;
  StatementId: string;
  Action: string;
  Principal: string;
  SourceArn: string;
  apiGatewayId: string;
  aidResourcePathPart: string;
}

export const addApiGatewayLambdaPermission = async (props: AddApiGatewayLambdaPermissionProps) => {
  const { Action, FunctionName, Principal, SourceArn, StatementId, aidResourcePathPart, apiGatewayId } = props;
  logger.log(`Adding API Gateway Permission`);

  try {
    const addPermissionParams = {
      FunctionName,
      StatementId,
      Action,
      Principal,
      SourceArn,
    };

    await Lambda.addPermission(addPermissionParams).promise();
    Logger.log(`Permission added for [API Gateway:${SourceArn}] to invoke Lambda: ${FunctionName}`);
  } catch (err) {
    logger.log(`Error, ${err}`);
  }
};

// nesh@lambdas.io
// yxk1RBN-bpv2djr5zqb
