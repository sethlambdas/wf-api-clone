import * as AWS from 'aws-sdk';

import { ConfigUtil } from '@lambdascrew/utility';

const config: { [key: string]: any } = {
  region: ConfigUtil.get('aws.region'),
};

if (process.env.NODE_ENV === 'development') {
  config.endpoint = new AWS.Endpoint(ConfigUtil.get('apiGateway.endpoint'));
}

export const APIGateway = new AWS.APIGateway(config);
