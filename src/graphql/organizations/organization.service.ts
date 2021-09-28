import { Inject, Injectable } from '@nestjs/common';

import { ConfigUtil } from '@lambdascrew/utility';

import {
  createApiKeyAPIGateway,
  createUsagePlanAPIGateway,
  createUsagePlanKeyAPIGateway,
  getRestApisAPIGateway,
  getUsagePlansAPIGateway,
} from '../../aws-services/api-gateway/api-gateway.util';
import { SimplePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { CreateOrganizationApiKeyInput } from './inputs/create-organization-api-key.input';
import { CreateOrganizationInput } from './inputs/create-organization.input';
import { GetOrganizationApiKeyActiveInput } from './inputs/get-organization-api-key-active.input';
import { SaveOrganizationInput } from './inputs/save-organization.input';
import { APIKey, Organization } from './organization.entity';
import { OrganizationRepository } from './organization.repository';

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(OrganizationRepository)
    private organizationRepository: OrganizationRepository,
  ) {}

  async createOrganization(createOrganizationInput: CreateOrganizationInput) {
    return this.organizationRepository.createOrganization(createOrganizationInput);
  }

  async saveOrganization(simplePrimaryKey: SimplePrimaryKey, saveOrganizationInput: SaveOrganizationInput) {
    const updatedAttribute = {
      ...saveOrganizationInput,
    } as Organization;

    return this.organizationRepository.saveOrganization(simplePrimaryKey, updatedAttribute);
  }

  async getOrganization(simplePrimaryKey: SimplePrimaryKey) {
    return this.organizationRepository.getOrganization(simplePrimaryKey);
  }

  async createOrganizationApiKey(createOrganizationApiKeyInput: CreateOrganizationApiKeyInput) {
    const { PK } = createOrganizationApiKeyInput;

    const usagePlans = await getUsagePlansAPIGateway({
      limit: null,
    });

    const workflowUsagePlan = usagePlans.items.find((usagePlan) => {
      return usagePlan.name === ConfigUtil.get('apiGateway.usagePlanName');
    });

    let currentUsagePlanId = '';

    if (!workflowUsagePlan) {
      const restApis = await getRestApisAPIGateway({
        limit: null,
      });

      const workflowRestApi = restApis.items.find((restApi) => {
        return restApi.name === ConfigUtil.get('apiGateway.restApiName');
      });

      const createUsagePlan = await createUsagePlanAPIGateway({
        name: ConfigUtil.get('apiGateway.usagePlanName'),
        apiStages: [
          {
            apiId: workflowRestApi.id,
            stage: process.env.NODE_ENV,
          },
        ],
      });
      currentUsagePlanId = createUsagePlan.id;
    } else {
      currentUsagePlanId = workflowUsagePlan.id;
    }

    const createApiKey = await createApiKeyAPIGateway({
      name: PK,
      enabled: true,
      generateDistinctId: true,
    });

    const createUsagePlanKey = await createUsagePlanKeyAPIGateway({
      keyId: createApiKey.id,
      keyType: 'API_KEY',
      usagePlanId: currentUsagePlanId,
    });

    const organization = await this.organizationRepository.getOrganization({
      PK,
    });

    const getApiKeys =
      organization.APIKEY?.map((apiKey: APIKey) => {
        apiKey.ACTIVE = false;
        return apiKey;
      }) || [];

    const updatedApiKeys = [
      ...getApiKeys,
      {
        KEY: createApiKey.value,
        ACTIVE: true,
      },
    ];

    return this.organizationRepository.saveOrganization(
      {
        PK,
      },
      {
        APIKEY: updatedApiKeys,
      },
    );
  }

  async getOrganizationApiKeyActive(getOrganizationApiKeyActiveInput: GetOrganizationApiKeyActiveInput) {
    const { PK } = getOrganizationApiKeyActiveInput;

    const organization = await this.organizationRepository.getOrganization({
      PK,
    });

    organization.APIKEY =
      organization.APIKEY?.filter((apiKey: APIKey) => {
        return apiKey.ACTIVE;
      }) || [];

    return organization;
  }
}
