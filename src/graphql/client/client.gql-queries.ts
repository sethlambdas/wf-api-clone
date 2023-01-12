export const LIST_CLIENTS = `
  query ListClients($inputs: ListClientsInput!) {
    ListClients(listClientsInput: $inputs) {
      PK
      SK
      name
      headers {
        fieldName
        fieldValue
      }
      secrets {
        rootUrl
      }
      fileUploadType
    }
  }
`;