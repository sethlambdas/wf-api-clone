export const LIST_INTEGRATION_APPS = `
  query ListIntegrationApps($inputs: ListIntegrationAppRecordsInput!) {
    ListIntegrationApps(listIntegrationAppRecordsInput: $inputs) {
      PK
      SK
      name
      type
      headers {
        fieldName
        fieldValue
      }
    }
  }
`;
