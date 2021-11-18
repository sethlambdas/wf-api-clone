export const GET_ORGANIZATION = `
  query GetOrganization($getOrganizationInput: GetOrganizationInput!) {
    GetOrganization(getOrganizationInput: $getOrganizationInput) {
      PK
      ORGNAME
      TotalUSR
      TotalWLF
    }
  }
`;

export const SAVE_ORGANIZATION = `
  mutation SaveOrganization($saveOrganizationInput: SaveOrganizationInput!) {
    SaveOrganization(saveOrganizationInput: $saveOrganizationInput) {
      PK
      ORGNAME
      TotalUSR
      TotalWLF
    }
  }
`;

export const CREATE_ORGANIZATION_API_KEY = `
  mutation CreateOrganizationApiKey($createOrganizationApiKeyInput: CreateOrganizationApiKeyInput!) {
    CreateOrganizationApiKey(createOrganizationApiKeyInput: $createOrganizationApiKeyInput) {
      APIKEY {
        KEY
        ACTIVE
      }
    }
  }
`;

export const GET_ORGANIZATION_API_KEY_ACTIVE = `
  mutation GetOrganizationApiKeyActive($getOrganizationApiKeyActiveInput: GetOrganizationApiKeyActiveInput!) {
    GetOrganizationApiKeyActive(getOrganizationApiKeyActiveInput: $getOrganizationApiKeyActiveInput) {
      APIKEY {
        KEY
        ACTIVE
      }
    }
  }
`;
