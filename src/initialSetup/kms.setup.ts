import { INestApplication, Logger } from '@nestjs/common';
import { createAliasKMS, createKeyKMS, listAliasesKMS } from '../utils/kms.util';

import { ConfigUtil } from '@lambdascrew/utility';

const logger = new Logger('SetupKMS');

export async function setupKMS(app: INestApplication) {
  logger.log('running initial kms setup');

  const aliases = await listAliasesKMS();

  const aliasExist = aliases?.Aliases?.find((alias) => alias.AliasName === ConfigUtil.get('aws.kms.alias'));

  if (!aliasExist) {
    const params = {
      KeyUsage: 'ENCRYPT_DECRYPT',
    };

    const data = await createKeyKMS(params);

    logger.log(`KMS KEY ID: ${data?.KeyMetadata?.KeyId}`);

    if (process.env.NODE_ENV === 'test') {
      process.env.AWS_KMS_KEY_ID = data?.KeyMetadata?.KeyId;
    }

    const aliasParams = {
      AliasName: 'alias/Workflow',
      TargetKeyId: data?.KeyMetadata?.KeyId,
    };

    await createAliasKMS(aliasParams);
  } else {
    logger.log(`KMS KEY ID: ${aliasExist?.TargetKeyId}`);

    if (process.env.NODE_ENV === 'test') {
      process.env.AWS_KMS_KEY_ID = aliasExist?.TargetKeyId;
    }
  }

  logger.log('kms setup - successful');

  return { success: true };
}
