import { registerEnumType } from '@nestjs/graphql';

export enum FileUploadType {
  'MULTIPART_RELATED' = 'MULTIPART/RELATED',
  'MULTIPART_FORMDATA' = 'MULTIPART/FORM-DATA',
  'DIRECT_BODY' = 'DIRECT-BODY',
}

export enum ClientIntegrationDetailsPlacementOption {
  'BODY' = 'BODY',
  'QUERY_PARAMS' = 'QUERY_PARAMS',
  'HEADERS' = 'HEADERS',
}

export enum ApiKeyConfigurationEnum {
  'QUERY_PARAMS' = 'QUERY_PARAMS',
  'HEADERS' = 'HEADERS',
}

registerEnumType(ClientIntegrationDetailsPlacementOption, {
  name: 'ClientIntegrationDetailsPlacementOption',
  description: 'client id and secret placement',
  valuesMap: {
    BODY: {
      description: 'equals to body',
    },
    QUERY_PARAMS: {
      description: 'equals to Query params',
    },
    HEADERS: {
      description: 'equals to headers',
    }
  },
});

registerEnumType(FileUploadType, {
  name: 'FileUploadType',
  description: 'The file upload types supported',
  valuesMap: {
    'MULTIPART_RELATED': {
      description: 'multipart/related upload',
    },

    'MULTIPART_FORMDATA': {
      description: 'multipart/form-data upload',
    },

    'DIRECT_BODY': {
      description: 'read stream data directly to body upload',
    },
  },
});
