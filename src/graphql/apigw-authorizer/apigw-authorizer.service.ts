import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import * as SafeBuffer from 'safe-buffer';

import { SimplePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { cipherCMS, KMSType } from '../../utils/kms.util';

import { ApigwAuthorizerRepository } from './apigw-authorizer.repository';
import { ApigwAuthorizer } from './apigw-authorizer.entity';
import { CreateApigwAuthorizerInput, CredentialsInput } from './inputs/create-apigw-authorizer.input';
import { FindApigwAuthorizerByPkInput } from './inputs/find-apigw-authorizer.input';

const Buffer = SafeBuffer.Buffer;

@Injectable()
export class ApigwAuthorizerService {
  constructor(
    @Inject(ApigwAuthorizerRepository)
    private apigwAuthorizerRepository: ApigwAuthorizerRepository,
  ) {}

  async createApigwAuthorizer(createApigwAuthorizerInput: CreateApigwAuthorizerInput): Promise<ApigwAuthorizer | null> {
    const { triggerId, type, credentials, httpMethod } = createApigwAuthorizerInput;

    const apigwAuthorizer: ApigwAuthorizer = {
      PK: `wlfId||${triggerId}`,
      type,
      httpMethod,
      credentials,
    };

    const checkExistingRecords = await this.findApigwAuthorizerByPK({
      PK: triggerId,
    });

    if (checkExistingRecords) {
      delete apigwAuthorizer?.PK;
      const updatedResult = await this.saveApigwAuthorizer(
        {
          PK: checkExistingRecords.PK,
        },
        apigwAuthorizer,
      );
      return updatedResult;
    }

    if (credentials) {
      if (type === 'BASIC') {
        let btoa;
        if (typeof Buffer === 'function') btoa = (string: string) => Buffer.from(string).toString('base64');
        else btoa = window.btoa.bind(window);
        const token = btoa(`${credentials.username}:${credentials.password}`);
        const updatedCredentials = {
          headerName: 'Authorization',
          headerValue: `Basic ${token}`,
        };
        apigwAuthorizer.credentials = await this.cipherApigwAuthorizer(KMSType.ENCRYPT, {
          ...credentials,
          ...updatedCredentials,
        });
      } else {
        apigwAuthorizer.credentials = await this.cipherApigwAuthorizer(KMSType.ENCRYPT, { ...credentials });
      }
    }

    const result = await this.apigwAuthorizerRepository.createApigwAuthorizer(apigwAuthorizer);

    return result;
  }

  async findApigwAuthorizerByPK(
    findApigwAuthorizerByPkInput: FindApigwAuthorizerByPkInput,
  ): Promise<ApigwAuthorizer | null> {
    const apigwAuthorizer = await this.apigwAuthorizerRepository.findApigwAuthorizerByPK(findApigwAuthorizerByPkInput);

    if (apigwAuthorizer) {
      const { credentials } = apigwAuthorizer;
      if (credentials) {
        apigwAuthorizer.credentials = await this.cipherApigwAuthorizer(KMSType.DECRYPT, credentials);
      }
      return apigwAuthorizer;
    }

    return null;
  }

  async cipherApigwAuthorizer(type: KMSType, credentials: Partial<CredentialsInput>) {
    let credentialsData = credentials;

    if (credentialsData) {
      credentialsData = await cipherCMS(type, credentialsData);
    }

    return credentialsData;
  }

  async saveApigwAuthorizer(key: SimplePrimaryKey, apigwAuthorizer: Partial<ApigwAuthorizer>) {
    const { credentials } = apigwAuthorizer;

    if (credentials) {
      apigwAuthorizer.credentials = await this.cipherApigwAuthorizer(KMSType.ENCRYPT, credentials);
    }

    return this.apigwAuthorizerRepository.saveApigwAuthorizer(key, apigwAuthorizer);
  }
}
