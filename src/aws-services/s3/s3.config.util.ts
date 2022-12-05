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
  config.endpoint = new AWS.Endpoint(ConfigUtil.get('aws.local'));
  config.s3ForcePathStyle = true;
}

export const S3 = new AWS.S3(config);
