export interface GetAccessTokenOptions {
  grant_type: string;
  code: string;
  redirect_uri: string;
}

export interface GetAccessTokenCredentials {
  client_id: string;
  client_secret: string;
}
