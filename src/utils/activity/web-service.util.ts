import { ConfigUtil } from '@lambdascrew/utility';
import { Logger } from '@nestjs/common';

import { InvokeLambda } from '../../aws-services/aws-lambda/lambda.util';
import { HttpMethod } from '../../graphql/common/enums/general.enum';
import { EventRequestParams } from '../workflow-types/lambda.types';

const logger = new Logger('webService');

export default async function webService(payload: any, state?: any) {
  logger.log('Web Service Activity');
  try {
    const { WLFN, Method, Endpoint, Name, Body, Headers, QueryStrings, ClientPK, ClientSK } = payload;

    logger.log('WEB SERVICE PAYLOAD');
    logger.log(payload);

    if (!Endpoint) {
      logger.error('No http/s endpoint specified.');
      throw new Error();
    }

    if (!Name) {
      logger.error('No variable name specified.');
      throw new Error();
    }

    const resolvedBody = resolvedFieldsFromBody(WLFN, Body, state);

    const eventReqPramas: EventRequestParams = {
      endpoint: {
        url: Endpoint,
        method: Method,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      queryStrings: {},
      body: '',
      auth: null,
    };

    if (ClientPK && ClientSK)
      eventReqPramas.auth = {
        client_pk: ClientPK,
        client_sk: ClientSK,
      };

    if (Headers) {
      const parsedHeaders = JSON.parse(Headers);
      eventReqPramas.headers = { ...eventReqPramas.headers, ...parsedHeaders };
    }

    if (QueryStrings) {
      const parsedQueryStrings = JSON.parse(QueryStrings);
      eventReqPramas.queryStrings = { ...eventReqPramas.queryStrings, ...parsedQueryStrings };
    }

    if (Method === HttpMethod.POST) eventReqPramas.body = resolvedBody || {};

    const data = await InvokeLambda(ConfigUtil.get('lambda.webServiceFunctionName'), eventReqPramas);

    findErrors(data);

    return { [`${payload.Name}`]: data };
  } catch (err) {
    logger.log('ERROR OCCURED:');
    logger.log(err);
    return 'ERROR OCCURRED!!!!';
  }
}

const resolvedFieldsFromBody = (WLFN: string, Body: string, state: any) => {
  if (!Body) return null;

  const { data } = state;

  const bodyObject = JSON.parse(Body);

  Object.keys(bodyObject).forEach((key: string) => {
    const regexBrackets = new RegExp(/{{(.*?)}}/gm);

    const match = regexBrackets.exec(bodyObject[key]);

    if (!match) return;

    const { 1: word } = match;
    const trimWord = word.trim();

    let workflowNameArr = WLFN.split(' ');
    workflowNameArr = workflowNameArr.filter((value) => {
      return value !== '' ? true : false;
    });
    const workflowName = workflowNameArr.join('_');

    if (word === `${workflowName}.payload`) bodyObject[key] = { ...data };
    else {
      let fields: string[];
      let dataValue: any;

      if (word.includes(`${workflowName}.payload`)) {
        fields = trimWord.split('payload.')[1].split('.');
        dataValue = { ...data };
      } else {
        fields = trimWord.split('.');
        dataValue = { ...state };
        delete dataValue.data;
      }

      let bodyObjectValue: any;

      fields.forEach((fieldName) => {
        bodyObjectValue = dataValue[fieldName];
        dataValue = dataValue[fieldName];
      });

      bodyObject[key] = bodyObjectValue;
    }
  });

  logger.log('RESOLVED BODY');
  logger.log(bodyObject);

  return bodyObject;
};

const findErrors = (data: any) => {
  logger.log('API RESULT');
  logger.log(data);

  const findErrorMessage = (object: any) => {
    Object.keys(object).forEach((key) => {
      if (key.toLowerCase() === 'message' || key.toLowerCase() === 'errormessage') {
        logger.log('FOUND ERROR MESSAGE');
        logger.log(key);
        throw new Error(JSON.stringify(object[key]));
      }
    });
  };

  Object.keys(data).forEach((key) => {
    if (key.toLowerCase() === 'error' || key.toLowerCase() === 'errortype' || key.toLowerCase() === 'errormessage') {
      logger.log('OBJECT KEYS');
      if (typeof data[key] === 'object') findErrorMessage(data[key]);
      else findErrorMessage(data);
    }
  });
};
