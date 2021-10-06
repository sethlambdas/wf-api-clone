export interface EventRequestParams {
  headers: any;
  queryStrings: any;
  body: any;
  endpoint: {
    url: string;
    method: string;
  };
  auth: {
    client_pk: string;
    client_sk: string;
  } | null;
  file: {
    files: string[];
    filefilter: string[];
  },
  retry: {
    retries: number;
    interval: number;
  }
}

export interface IFieldValue {
  fieldName: string;
  fieldValue: string;
}
