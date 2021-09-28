import * as AWS from 'aws-sdk';

import { ConfigUtil } from '@lambdascrew/utility';

const config: { [key: string]: any } = {
  region: ConfigUtil.get('aws.region'),
};

if (process.env.NODE_ENV === 'development') config.endpoint = new AWS.Endpoint(ConfigUtil.get('aws.local'));

export const Lambda = new AWS.Lambda(config);
