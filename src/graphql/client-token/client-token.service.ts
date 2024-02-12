import { Inject, Injectable, Logger } from '@nestjs/common';

import { SimplePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { cipherCMS, KMSType } from '../../utils/kms.util';
import { ClientToken } from './client-token.entity';
import { ClientTokenRepository } from './client-token.repository';
import { CreateClientTokenInput } from './inputs/create-client-token.inputs';
import { FindClientTokenByPkInput } from './inputs/find-client-token.input';

@Injectable()
export class ClientTokenService {
  constructor(
    @Inject(ClientTokenRepository)
    private clientTokenRepository: ClientTokenRepository,
  ) {}

  async createClientToken(createClientTokenInput: CreateClientTokenInput): Promise<ClientToken | null> {
    const { refreshToken, accessToken } = createClientTokenInput;
    const checkExistingRecords = await this.findClientTokenByPK({ PK: createClientTokenInput.PK });

    if (checkExistingRecords) {
      delete createClientTokenInput?.PK;
      const updatedResult = await this.updateClientTokenByPK(
        {
          PK: checkExistingRecords.PK,
        },
        createClientTokenInput,
      );
      return updatedResult;
    }

    const cipherData = await this.cipherClientTokens(KMSType.ENCRYPT, {
      refreshToken,
      accessToken,
    });

    if (cipherData.accessToken) {
      createClientTokenInput.accessToken = cipherData.accessToken;
    }

    if (cipherData.refreshToken) {
      createClientTokenInput.refreshToken = cipherData.refreshToken;
    }

    const result = await this.clientTokenRepository.createClientToken(createClientTokenInput);

    return result;
  }

  async cipherClientTokens(kmsType: KMSType, clientToken: Partial<ClientToken>) {
    const { refreshToken, accessToken } = clientToken;
    let secretsData = {
      refreshToken,
      accessToken,
    };

    if (secretsData) {
      secretsData = await cipherCMS(kmsType, secretsData);
    }

    return secretsData;
  }

  async findClientTokenByPK(findClientByPkInput: FindClientTokenByPkInput): Promise<ClientToken | null> {
    const clientToken = await this.clientTokenRepository.findClientTokenByPK(findClientByPkInput);

    if (clientToken) {
      const { refreshToken, accessToken } = clientToken;

      const cipherData = await this.cipherClientTokens(KMSType.DECRYPT, {
        refreshToken,
        accessToken,
      });

      if (cipherData.accessToken) {
        clientToken.accessToken = cipherData.accessToken;
      }

      if (cipherData.refreshToken) {
        clientToken.refreshToken = cipherData.refreshToken;
      }
      clientToken.timestamp = {
        createdAt: clientToken['created_at'],
        updatedAt: clientToken['updated_at'],
      };

      return clientToken;
    }

    return null;
  }

  async updateClientTokenByPK(key: SimplePrimaryKey, clientToken: Partial<ClientToken>) {
    const { refreshToken, accessToken } = clientToken;

    const cipherData = await this.cipherClientTokens(KMSType.ENCRYPT, {
      refreshToken,
      accessToken,
    });

    if (cipherData.accessToken) {
      clientToken.accessToken = cipherData.accessToken;
    }

    if (cipherData.refreshToken) {
      clientToken.refreshToken = cipherData.refreshToken;
    }

    return this.clientTokenRepository.saveClientToken(key, clientToken);
  }

  async scanClientTokenRecords() {
    const results = await this.clientTokenRepository.scanClientTokenRecords();

    for (const result of results) {
      const { accessToken, refreshToken } = result;
      const cipherData = await this.cipherClientTokens(KMSType.DECRYPT, {
        refreshToken,
        accessToken,
      });

      if (cipherData.accessToken) {
        result.accessToken = cipherData.accessToken;
      }

      if (cipherData.refreshToken) {
        result.refreshToken = cipherData.refreshToken;
      }
    }

    return results;
  }

  // for testing in jest use only!!!!
  async deleteClientTokenRecords(primaryKey: SimplePrimaryKey) {
    await this.clientTokenRepository.deleteClientTokenRecords(primaryKey);
  }
}
