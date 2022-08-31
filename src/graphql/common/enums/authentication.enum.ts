import { registerEnumType } from '@nestjs/graphql';

export enum AuthType {
  'APIKey' = 'API-KEY',
  'BASIC' = 'BASIC',
  'OAUTH' = 'OAUTH',
  'COOKIE' = 'COOKIE',
}

export enum ClientStatus {
  'ACTIVE' = 'ACTIVE',
  'DISABLED' = 'DISABLED',
}

registerEnumType(AuthType, {
  name: 'AuthType',
  description: 'The authentication types supported',
  valuesMap: {
    APIKey: {
      description: 'equals to API-KEY',
    },
    BASIC: {
      description: 'equals to BASIC',
    },
    OAUTH: {
      description: 'equals to OAUTH',
    },
    COOKIE: {
      description: 'equals to COOKIE',
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
