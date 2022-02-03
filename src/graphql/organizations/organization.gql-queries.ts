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
