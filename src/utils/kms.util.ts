import { Logger } from '@nestjs/common';
import { KMS } from 'aws-sdk';

import { ConfigUtil } from '@lambdascrew/utility';

const logger = new Logger('KMS');

const localEndpoint = ConfigUtil.get('aws.local');
const region = ConfigUtil.get('aws.region');
const accessKeyId = ConfigUtil.get('aws.accessKeyId');
const secretAccessKey = ConfigUtil.get('aws.secretAccessKey');

const clientKMSKeys = ['apiKey', 'clientId', 'clientSecret', 'username', 'password', 'cookie'];
const clientTokenKMSKeys = ['accessToken', 'refreshToken'];
const apigwAuthorizerKMSKeys = ['username', 'password', 'headerName', 'headerValue'];
const kmsKeys = [...clientKMSKeys, ...clientTokenKMSKeys, ...apigwAuthorizerKMSKeys];

const getKMS = () => {
  return process.env.NODE_ENV === 'production'
    ? new KMS({ region })
    : new KMS({
        accessKeyId,
        secretAccessKey,
        region,
        endpoint: localEndpoint,
      });
};

const kms = getKMS();

export async function createKeyKMS(params: KMS.Types.CreateKeyRequest) {
  try {
    return kms.createKey(params).promise();
  } catch (err) {
    logger.error('ERROR:', err);
    throw err;
  }
}

export async function createAliasKMS(params: KMS.Types.CreateAliasRequest) {
  try {
    return kms.createAlias(params).promise();
  } catch (err) {
    logger.error('ERROR:', err);
    throw err;
  }
}

export async function listAliasesKMS(params?: KMS.Types.ListAliasesRequest) {
  try {
    return kms.listAliases(params).promise();
  } catch (err) {
    logger.error('ERROR:', err);
    throw err;
  }
}

export async function encryptKMS(data: any) {
  try {
    const encryptParams: KMS.Types.EncryptRequest = {
      KeyId: ConfigUtil.get('aws.kms.keyId'),
      Plaintext: JSON.stringify(data),
    };
    logger.log(`encryptKMS KeyId: ${encryptParams.KeyId}`);
    const encryptData = await kms.encrypt(encryptParams).promise();
    logger.log(`encryptKMS encryptData: ${encryptData}`);
    const base64EncryptedString = encryptData?.CiphertextBlob?.toString('base64');
    return base64EncryptedString;
  } catch (err) {
    logger.error('ERROR:', err);
    throw err;
  }
}

export async function decryptKMS(base64EncryptedString: string) {
  try {
    const decryptParams: KMS.Types.DecryptRequest = {
      KeyId: ConfigUtil.get('aws.kms.keyId'),
      CiphertextBlob: Buffer.from(base64EncryptedString, 'base64'),
    };
    logger.log(`decryptKMS - about to decrypt`);
    const decryptData = await kms.decrypt(decryptParams).promise();
    logger.log(`decryptKMS - decrypted`);
    const text = decryptData?.Plaintext?.toString('ascii');
    return text && JSON.parse(text);
  } catch (err) {
    logger.error('ERROR:', err);
    throw err;
  }
}

export enum KMSType {
  ENCRYPT,
  DECRYPT,
}

export async function cipherCMS(type: KMSType, data: any) {
  logger.log(`cipherCMS - start`);
  const updatedData = data;
  for (const key in updatedData) {
    if (updatedData.hasOwnProperty(key) && kmsKeys.indexOf(key) > -1 && updatedData[key]) {
      const dataValue = updatedData[key];
      if (type === KMSType.ENCRYPT) {
        updatedData[key] = await encryptKMS(dataValue);
      } else if (type === KMSType.DECRYPT) {
        updatedData[key] = await decryptKMS(dataValue);
      }
    }
  }
  logger.log(`cipherCMS - done`);
  return updatedData;
}
