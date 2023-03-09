import { ConfigUtil } from '@lambdascrew/utility';
import { DynamooseModuleOptions } from 'nestjs-dynamoose';

const localEndpoint = ConfigUtil.get('aws.local') ? ConfigUtil.get('aws.local') : false;

export const dynamooseOptions = (): DynamooseModuleOptions => {
  return {
    local: localEndpoint,
    aws: {
      region: ConfigUtil.get('aws.region'),
    },
  };
};
