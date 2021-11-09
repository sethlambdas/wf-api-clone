export class HeaderSchema {
  fieldName?: string;
  fieldValue?: string;
}

export class IntegrationApp {
  PK: string;
  SK: string;
  name: string;
  type: string;
  headers: [HeaderSchema];
}

export interface IListIntegrationApps {
  data: {
    ListIntegrationApps: IntegrationApp[];
  };
}
