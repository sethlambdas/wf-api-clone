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

export class SecretsSchema {
  apiKey?: string;

  clientId?: string;

  clientSecret?: string;

  username?: string;

  password?: string;
}

export class Client {
  PK: string;

  SK: string;

  name: string;

  type: AuthType;

  status: ClientStatus;

  intAppId: string;

  secrets: SecretsSchema;
}

export interface IListClients {
  data: {
    ListClients: Client[]
  }
}