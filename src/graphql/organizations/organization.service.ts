import { Inject, Injectable } from '@nestjs/common';
import { SimplePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { Organization } from './organization.entity';
import { OrganizationRepository } from './organization.repository';

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(OrganizationRepository)
    private organizationRepository: OrganizationRepository,
  ) {}

  async saveOrganization(saveOrganizationInput: Partial<Organization>) {
    const updatedAttribute = {
      ...saveOrganizationInput,
    } as Organization;

    return this.organizationRepository.saveOrganization(updatedAttribute);
  }

  async getOrganization(simplePrimaryKey: SimplePrimaryKey) {
    return this.organizationRepository.getOrganization(simplePrimaryKey);
  }

  async createOrganizationApiKey(payload: any) {
    return this.organizationRepository.createOrganizationApiKey(payload);
  }

  async getOrganizationApiKeyActive(simplePrimaryKey: SimplePrimaryKey) {
    return this.organizationRepository.getOrganizationApiKeyActive(simplePrimaryKey);
  }
}
