export class CredentialsSchema {
  username?: string;

  password?: string;

  headerName?: string;

  headerValue?: string;
}

export class ApigwAuthorizer {
  PK: string;

  type: string;

  httpMethod: string;

  credentials: CredentialsSchema;
}

export interface IFindApigwAuthorizer {
  data: {
    FindApigwAuthorizerByPK: ApigwAuthorizer;
  };
}

export interface ICreateApigwAuthorizer {
  data: {
    CreateApigwAuthorizer: ApigwAuthorizer;
  };
}
