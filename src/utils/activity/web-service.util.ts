import { ConfigUtil } from '@lambdascrew/utility';
import { Logger } from '@nestjs/common';
import { get } from 'lodash';

import { InvokeLambda } from '../../aws-services/aws-lambda/lambda.util';
import { AuthType } from '../../graphql/common/enums/authentication.enum';
import { HttpMethod } from '../../graphql/common/enums/general.enum';
import { getMentionedData } from '../helpers/string-helpers.util';
import { EventRequestParams, IFieldValue } from '../workflow-types/lambda.types';

const logger = new Logger('webService');

const credentials: string[] = ['accessToken', 'clientId', 'clientSecret', 'username', 'password'];

export default async function webService(payload: any, state?: any) {
  logger.log('Web Service Activity');
  try {
    const {
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
      FileTypeOption,
      MultipartContentType,
      MultipartMetaData,
      Evaluations,
      Retries,
      Interval,
      webServiceDownloadFile,
      targetFileName,
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

    const resolvedBody = resolveMentionedVariables(Body, state);
    const eventReqPramas: EventRequestParams = {
      endpoint: {
        url: resolveMentionedVariables(Endpoint, state),
        method: Method,
      },
      headers: {},
      queryStrings: {},
      body: {},
      auth: null,
      file: {
        files: null,
        filefilter: null,
        FileTypeOption: null,
        MultipartContentType: null,
        MultipartMetaData: null,
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

    if (!!webServiceDownloadFile) eventReqPramas.headers = { ...eventReqPramas.headers, webServiceDownloadFile };

    if (Headers) {
      const parsedHeaders = Headers && JSON.parse(Headers);
      eventReqPramas.headers = { ...eventReqPramas.headers, ...resolveFieldValues(parsedHeaders, state) };
    }

    if (QueryStrings) {
      const parsedQueryStrings = QueryStrings && JSON.parse(QueryStrings);
      eventReqPramas.queryStrings = {
        ...eventReqPramas.queryStrings,
        ...resolveFieldValues(parsedQueryStrings, state),
      };
    }

    if (Files) {
      const fileLinks = getMentionedData(Files, state);
      const parsedFilesArr = fileLinks && JSON.parse(fileLinks);

      const fileFilters: string[] = (FileFilter as string).split(',').map((value) => {
        return value.trim();
      });

      eventReqPramas.file = {
        files: parsedFilesArr.length === 0 ? null : parsedFilesArr,
        filefilter: fileFilters.length === 0 ? null : fileFilters,
        FileTypeOption: FileTypeOption || null,
        MultipartContentType: MultipartContentType || null,
        MultipartMetaData: MultipartMetaData || null,
      };
    }

    if ([HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH].includes(Method))
      eventReqPramas.body = (resolvedBody && JSON.parse(resolvedBody)) || {};

    logger.error('resolvedBody', resolvedBody);
    const data: any = await InvokeLambda(
      ConfigUtil.get('lambda.webServiceFunctionName'),
      eventReqPramas,
      webServiceDownloadFile || false,
      targetFileName,
    );

    let parseData = data;

    const requestParams: any = { ...eventReqPramas };
    delete requestParams.auth;
    delete requestParams.retry;
    if (requestParams.file.files === null) delete requestParams.file;

    checkEvaluations(Evaluations, data, requestParams);
    if (ClientSK.includes(AuthType.AWSSignature)) {
      requestParams.headers = { ...requestParams.headers, ...JSON.parse(data).headers };
      parseData = removeAWSHeaders(JSON.parse(data));
    }

    return { request: requestParams, response: parseData };
  } catch (err) {
    logger.log('ERROR OCCURED:');
    logger.log(err);
    if (err.errorMessage)
      return {
        isError: true,
        details: err.errorMessage,
        request: err.request ? { ...err.request } : '',
        response: err.response ? { ...err.response } : '',
      };
    return { isError: true, details: err };
  }
}

const resolveFieldValues = (fieldValues: IFieldValue[], state: any) => {
  const object: any = {};
  fieldValues.forEach(({ fieldName, fieldValue }) => {
    object[fieldName] = resolveMentionedVariables(fieldValue, state);
  });

  return object;
};

export function resolveMentionedVariables(unresolvedString: string, state?: any) {
  if (!unresolvedString) {
    return '';
  }
  return getMentionedData(unresolvedString, state);
}

const checkEvaluations = (Evaluations: string, data: any, requestParams: EventRequestParams) => {
  const parseEval: IFieldValue[] = JSON.parse(Evaluations);
  const result = JSON.parse(data);

  parseEval.forEach(({ fieldName, fieldValue }) => {
    const resultValue = get(result, fieldName);

    if (!resultValue)
      throw {
        errorMessage: `"${fieldName}" field not existing in network response`,
        request: requestParams,
        response: { ...result },
      };

    processEvaluation(fieldName, fieldValue, resultValue, result, requestParams);
  });

  logger.log('ALL EVALUATIONS PASSED :: REQUEST IS SUCCESSFUL');
};

const removeAWSHeaders = (obj: any) => {
  const headers = obj.headers;
  delete headers.Authorization;
  delete headers['X-Amz-Content-Sha256'];
  delete headers['X-Amz-Date'];
  return JSON.stringify(obj);
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
      throw {
        errorMessage: `${fieldName} Field with value '${fieldValue}' is not equals to actual result '${result}'`,
        request: requestParams,
        response: { ...data },
      };
  },
};
