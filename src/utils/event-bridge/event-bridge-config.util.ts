import * as AWS from 'aws-sdk';
import { ConfigUtil } from '../config.util';

const config = {
  endpoint: new AWS.Endpoint(ConfigUtil.get('eventBridge.endpoint')),
  region: ConfigUtil.get('aws.region'),
};

export const EB = new AWS.EventBridge(config);
