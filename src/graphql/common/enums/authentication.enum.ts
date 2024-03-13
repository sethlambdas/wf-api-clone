import { registerEnumType } from '@nestjs/graphql';

export enum AuthType {
  'API_KEY' = 'API_KEY',
  'BEARER' = 'BEARER',
  'BASIC' = 'BASIC',
  'OAUTH' = 'OAUTH',
  'COOKIE' = 'COOKIE',
  'AWSSignature' = 'AWS Signature'
}

export enum ClientStatus {
  'ACTIVE' = 'ACTIVE',
  'DISABLED' = 'DISABLED',
}

registerEnumType(AuthType, {
  name: 'AuthType',
  description: 'The authentication types supported',
  valuesMap: {
    API_KEY: {
      description: 'equals to API-KEY depends on key,value, add to(queryparams,headers)',
    },
    BEARER: {
      description: 'equals to BEARER provide directly the token',
    },
    BASIC: {
      description: 'equals to BASIC provide with username:password',
    },
    OAUTH: {
      description: 'equals to OAUTH',
    },
    COOKIE: {
      description: 'equals to COOKIE',
    },
    AWSSignature: {
      description: 'equals to AWS Signature',
    },
  },
});

registerEnumType(ClientStatus, {
  name: 'ClientStatus',
  description: 'The client status',
  valuesMap: {
    ACTIVE: {
      description: 'equals to ACTIVE',
    },
    DISABLED: {
      description: 'equals to DISABLED',
    },
  },
});
