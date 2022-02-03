export const FIND_APIGW_AUTHORIZER_BY_PK = `
  query FindApigwAuthorizerByPK($inputs: FindApigwAuthorizerByPkInput!) {
    FindApigwAuthorizerByPK(findApigwAuthorizerByPkInput: $inputs) {
      PK
      type
      httpMethod
      credentials {
        username
        password
        headerName
        headerValue
      }
    }
  }
`;

export const CREATE_APIGW_AUTHORIZER = `
  mutation CreateApigwAuthorizer($inputs: CreateApigwAuthorizerInput!) {
    CreateApigwAuthorizer(createApigwAuthorizerInput: $inputs) {
      PK
      type
      httpMethod
      credentials {
        username
        password
        headerName
        headerValue
      }
    }
  }
`;
