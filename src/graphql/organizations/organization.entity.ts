export class APIKey {
  KEY: string;
  ACTIVE: boolean;
}

export class Organization {
  PK: string;
  ORGNAME: string;
  TotalWLFBatches: number;
  TotalUSR: number;
  APIKEY: APIKey[];
}

export interface IGetOrganization {
  data: {
    GetOrganization: Organization;
  };
}

export interface ISaveOrganization {
  data: {
    SaveOrganization: Organization;
  };
}
