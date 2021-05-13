import { Inject, Injectable } from '@nestjs/common';
import { SimplePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { CreateOrganizationInput } from './inputs/create-organization.input';
import { SaveOrganizationInput } from './inputs/save-organization.input';
import { Organization } from './organization.entity';
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
}
