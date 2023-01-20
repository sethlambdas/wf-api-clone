export interface GetAccessTokenOptions {
  grant_type: string;
  code: string;
  redirect_uri: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  code_verifier?: string;
  context?: string;
}

export interface GetAccessTokenCredentials {
  client_id: string;
  client_secret: string;
}
