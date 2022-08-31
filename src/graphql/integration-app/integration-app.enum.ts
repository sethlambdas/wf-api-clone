import { registerEnumType } from '@nestjs/graphql';

export enum FileUploadType {
  'MULTIPART_RELATED' = 'MULTIPART/RELATED',
  'MULTIPART_FORMDATA' = 'MULTIPART/FORM-DATA',
  'DIRECT_BODY' = 'DIRECT-BODY',
}

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
