import * as AWS from 'aws-sdk';
import { ConfigUtil } from '../config.util';

const config: { [key: string]: any } = {
  region: ConfigUtil.get('aws.region'),
};

if (process.env.NODE_ENV === 'development') {
  config.endpoint = new AWS.Endpoint(ConfigUtil.get('eventBridge.endpoint'));
}

export const EB = new AWS.EventBridge(config);
