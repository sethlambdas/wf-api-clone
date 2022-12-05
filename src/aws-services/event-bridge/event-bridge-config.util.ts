import * as AWS from 'aws-sdk';

import { ConfigUtil } from '@lambdascrew/utility';

const region = ConfigUtil.get('aws.region');
const accessKeyId = ConfigUtil.get('aws.accessKeyId');
const secretAccessKey = ConfigUtil.get('aws.secretAccessKey');

const config: { [key: string]: any } = {
  region,
  accessKeyId,
  secretAccessKey,
};

if (process.env.NODE_ENV === 'development') {
  config.endpoint = new AWS.Endpoint(ConfigUtil.get('eventBridge.endpoint'));
}

export const EB = new AWS.EventBridge(config);
