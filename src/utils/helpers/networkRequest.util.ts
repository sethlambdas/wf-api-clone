import { Logger } from '@nestjs/common';
import got from 'got';

export enum HttpMethod {
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
  GET = 'GET',
  HEAD = 'HEAD',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
}

export interface IGraphqlPayload {
  query: any;
  variables: any;
}

export interface NetworkClientOptions {
  method: HttpMethod;
  url: string;
  headers: any;
  queryParams: any;
  bodyParams?: any;
}

const logger = new Logger('NETWORK-REQUEST-CLIENT');

export const networkClient = async ({ method, url, headers, queryParams, bodyParams }: NetworkClientOptions) => {
  const options = getOptions(method, url, headers, queryParams, bodyParams);

  logger.log('REQUEST OPTIONS:');
  logger.log(options);

  const data = await got(options).json();

  return data;
};

const getOptions = (method: HttpMethod, url: string, headers: any, queryParams: any, bodyParams: any) => {
  const searchParams: any = new URLSearchParams(queryParams);
  const queryOptions = {
    searchParams,
  };

  const bodyOptions = {
    json: {
      ...bodyParams,
    },
  };

  let options = {
    method,
    url,
    headers,
    ...queryOptions,
  };

  if (method === HttpMethod.POST) options = { ...options, ...bodyOptions };

  return options;
};
