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
    const {
      WLFN,
      Method,
      Endpoint,
      Name,
      Body,
      Headers,
      QueryStrings,
      ClientPK,
      ClientSK,
      Files,
      FileFilter,
      Evaluations,
      Retries,
      Interval,
    } = payload;

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
        Accept: 'application/json',
      },
      queryStrings: {},
      body: {},
      auth: null,
      file: {
        files: null,
        filefilter: null,
      },
      retry: {
        retries: Retries || 3,
        interval: Interval || 10,
      },
    };

    if (ClientPK && ClientSK)
      eventReqPramas.auth = {
        client_pk: ClientPK,
        client_sk: ClientSK,
      };

    if (Headers) {
      const parsedHeaders = Headers && JSON.parse(Headers);
      eventReqPramas.headers = { ...eventReqPramas.headers, ...resolveFieldValues(parsedHeaders, WLFN, state) };
    }

    if (QueryStrings) {
      const parsedQueryStrings = QueryStrings && JSON.parse(QueryStrings);
      eventReqPramas.queryStrings = {
        ...eventReqPramas.queryStrings,
        ...resolveFieldValues(parsedQueryStrings, WLFN, state),
      };
    }

    if (Files) {
      const fileLinks = getMentionedData(Name, Files, state);
      const parsedFilesArr = fileLinks && JSON.parse(fileLinks);

      const fileFilters: string[] = (FileFilter as string).split(',').map((value) => {
        return value.trim();
      });

      eventReqPramas.file = {
        files: parsedFilesArr.length === 0 ? null : parsedFilesArr,
        filefilter: fileFilters.length === 0 ? null : fileFilters,
      };
    }

    if ([HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH].includes(Method))
      eventReqPramas.body = (resolvedBody && JSON.parse(resolvedBody)) || {};

    const data = await InvokeLambda(ConfigUtil.get('lambda.webServiceFunctionName'), eventReqPramas);

    const requestParams: any = { ...eventReqPramas };
    delete requestParams.auth;
    delete requestParams.retry;
    if (requestParams.file.files === null) delete requestParams.file;

    checkEvaluations(Evaluations, data, requestParams);

    return { request: requestParams, response: data };
  } catch (err) {
    logger.log('ERROR OCCURED:');
    logger.log(err);
    if (err.errorMessage)
      return { isError: true, details: err.errorMessage, request: err.request ? { ...err.request } : '', response: err.response ? { ...err.response } : '' };
    return { isError: true, details: err };
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

  let workflowNameArr = WLFN.split(' ');
  workflowNameArr = workflowNameArr.filter((value) => {
    return value !== '' ? true : false;
  });
  const workflowName = workflowNameArr.join('_').toLowerCase();

  return getMentionedData(workflowName, unresolvedString, state);
}

export function getMentionedData(name: string, unresolvedString: string, state?: any) {
  const { data } = state;

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

    if (trimWord === `http_${name}`) replacement = data;
    else if (trimWord.includes(`http_${name}`)) {
      fields = trimWord.split('.')[1];
      replacement = get(data, fields);
    } else {
      replacement = get(state, trimWord);
    }

    resolvedString = replaceAt(
      resolvedString,
      index,
      lastIndex,
      typeof replacement === 'object' ? JSON.stringify(replacement) : replacement,
    );
  }

  logger.log('RESOLVED STRING');
  logger.log(resolvedString);

  return resolvedString;
}

const checkEvaluations = (Evaluations: string, data: any, requestParams: EventRequestParams) => {
  const parseEval: IFieldValue[] = JSON.parse(Evaluations);
  const result = JSON.parse(data);

  parseEval.forEach(({ fieldName, fieldValue }) => {
    const resultValue = get(result, fieldName);

    if (!resultValue) throw { errorMessage: `"${fieldName}" field not existing in network response`, request: requestParams, response: { ...result } };

    processEvaluation(fieldName, fieldValue, resultValue, result, requestParams);
  });

  logger.log('ALL EVALUATIONS PASSED :: REQUEST IS SUCCESSFUL');
};

const processEvaluation = (fieldName: string, fieldValue: string, result: any, data: any, requestParams: any) => {
  const regexBrackets = /<<(.*?)>>/gm;
  const match = regexBrackets.exec(fieldValue);
  let operation = 'default';

  if (match) {
    const { 1: word } = match;
    operation = word.trim();
  }

  evalOperations[operation](fieldName, fieldValue, result, data, requestParams);
};

const evalOperations = {
  exist: () => {
    return;
  },
  default: (...args) => {
    const [fieldName, fieldValue, result, data, requestParams] = args;
    if (JSON.stringify(result) !== fieldValue)
      throw { errorMessage: `${fieldName} Field with value '${fieldValue}' is not equals to actual result '${result}'`, request: requestParams, response: { ...data } };
  },
};
