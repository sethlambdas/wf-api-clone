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
}
