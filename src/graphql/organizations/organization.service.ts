import { Inject, Injectable } from '@nestjs/common';
import { CreateOrganizationInput } from './inputs/create-organization.input';
import { OrganizationRepository } from './organization.repository';

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(OrganizationRepository)
    private organizationRepository: OrganizationRepository,
  ) {}

  async createOrganization(createOrganizationInput: CreateOrganizationInput) {
    return await this.organizationRepository.createOrganization(createOrganizationInput);
  }
}
