export class CreateApigwAuthorizerInput {
  triggerId: string;

  type: string;

  httpMethod: string;

  credentials: {
    username?: string;
    password?: string;
    headerName?: string;
    headerValue?: string;
  };
}
