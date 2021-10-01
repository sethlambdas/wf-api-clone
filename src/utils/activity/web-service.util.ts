import { ConfigUtil } from '@lambdascrew/utility';
import { Logger } from '@nestjs/common';
import { get } from 'lodash';

import { InvokeLambda } from '../../aws-services/aws-lambda/lambda.util';
import { HttpMethod } from '../../graphql/common/enums/general.enum';
import { replaceAt } from '../helpers/string-helpers.util';
import { EventRequestParams, IFieldValue } from '../workflow-types/lambda.types';

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

    const resolvedBody = resolveMentionedVariables(WLFN, Body, state);

    const eventReqPramas: EventRequestParams = {
      endpoint: {
        url: resolveMentionedVariables(WLFN, Endpoint, state),
        method: Method,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      queryStrings: {},
      body: {},
      auth: null,
    };

    if (ClientPK && ClientSK)
      eventReqPramas.auth = {
        client_pk: ClientPK,
        client_sk: ClientSK,
      };

    if (Headers) {
      const parsedHeaders = JSON.parse(Headers);
      eventReqPramas.headers = { ...eventReqPramas.headers, ...resolveFieldValues(parsedHeaders, WLFN, state) };
    }

    if (QueryStrings) {
      const parsedQueryStrings = JSON.parse(QueryStrings);
      eventReqPramas.queryStrings = {
        ...eventReqPramas.queryStrings,
        ...resolveFieldValues(parsedQueryStrings, WLFN, state),
      };
    }

    if (Method === HttpMethod.POST) eventReqPramas.body = JSON.parse(resolvedBody) || {};

    const data = await InvokeLambda(ConfigUtil.get('lambda.webServiceFunctionName'), eventReqPramas);

    findErrors(data);

    return { [`${payload.Name}`]: data };
  } catch (err) {
    logger.log('ERROR OCCURED:');
    logger.log(err);
    return 'ERROR OCCURRED!!!!';
  }
}

const resolveFieldValues = (fieldValues: IFieldValue[], WLFN: string, state: any) => {
  const object: any = {};
  fieldValues.forEach(({ fieldName, fieldValue }) => {
    object[fieldName] = resolveMentionedVariables(WLFN, fieldValue, state);
  });

  return object;
};

export function resolveMentionedVariables(WLFN: string, unresolvedString: string, state?: any) {
  if (!unresolvedString) {
    return '';
  }

  const { data } = state;

  let workflowNameArr = WLFN.split(' ');
  workflowNameArr = workflowNameArr.filter((value) => {
    return value !== '' ? true : false;
  });
  const workflowName = workflowNameArr.join('_').toLowerCase();

  const regexBrackets = /{{(.*?)}}/gm;
  let resolvedString = unresolvedString;
  while (true) {
    const match = regexBrackets.exec(resolvedString);
    if (!match) {
      break;
    }
    const { 0: origWord, 1: word, index } = match;
    const lastIndex = index + origWord.length;
    const trimWord = word.trim();

    let replacement: any;
    let fields = trimWord;

    if (trimWord === `http_${workflowName}`) replacement = data;
    else if (trimWord.includes(`http_${workflowName}`)) {
      fields = trimWord.split('.')[1];
      replacement = get(data, fields);
    } else {
      replacement = get(state, trimWord);
    }

    resolvedString = replaceAt(resolvedString, index, lastIndex, replacement);
  }

  logger.log('RESOLVED STRING');
  logger.log(resolvedString);

  return resolvedString;
}

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
