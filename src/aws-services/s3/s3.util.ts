import { Logger } from '@nestjs/common';
import { ConfigUtil } from '@lambdascrew/utility';
import { S3 } from './s3.config.util';

const bucketName = ConfigUtil.get('s3.bucket');

const logger = new Logger('S3');

export const UploadFileToS3 = async (body: Buffer, fileName: string) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: `downloadedFiles/${fileName}`,
      Body: body,
      ACL: 'private',
    };
  
    const url = await new Promise((resolve, reject) => {
      S3.upload(params, async (err, data) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        resolve(data.Location);
      });
    });

    const signedUrl = await getPresignedUrl(params);

    return signedUrl;
  } catch (err) {
    logger.log(`Error, ${err}`);
  }
}

export async function getPresignedUrl(params: any) {
  const presignedUrl = S3.getSignedUrl('getObject', {
    Bucket: params.Bucket,
    Key: params.Key,
    Expires: ConfigUtil.get('s3.expiresIn'),
  });

  logger.log('PRESIGNED URL: ', presignedUrl);

  return presignedUrl;
}
