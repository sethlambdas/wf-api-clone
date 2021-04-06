import { createReadStream } from 'fs';
import * as request from 'supertest';
import { getHttpServerTesting, setUpTesting, tearDownTesting } from '../test-e2e';
import { ConfigUtil } from './../../src/utils/config.util';

const gql = {
  uploadFilesMutation: `
    mutation UploadFiles($uploadFilesInput: UploadFilesInput!) {
      UploadFiles(uploadFilesInput: $uploadFilesInput) {
        filename
      }
    }
  `,
};

const filename = 'test-image.jpg';
const file = createReadStream(`${ConfigUtil.get('files.dir')}${filename}`);

describe('FileResolver (e2e)', () => {
  beforeAll(async () => {
    await setUpTesting();
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('uploadFiles', () => {
    it('should upload the files', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .field(
          'operations',
          JSON.stringify({
            query: gql.uploadFilesMutation,
            variables: {
              uploadFilesInput: {
                files: [null],
              },
            },
          }),
        )
        .field('map', JSON.stringify({ 1: ['variables.uploadFilesInput.files.0'] }))
        .attach('1', file)
        .expect(({ body: { data } }) => {
          const uploadFiles = data.UploadFiles;
          expect(uploadFiles.length).toBe(1);
          expect(uploadFiles[0].filename).not.toBe('');
        })
        .expect(200);
    });
  });
});
