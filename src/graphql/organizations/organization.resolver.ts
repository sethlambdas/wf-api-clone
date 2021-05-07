import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CreateOrganizationInput } from './inputs/create-organization.input';
import { Organization } from './organization.entity';
import { OrganizationService } from './organization.service';

@Resolver((of) => Organization)
export class OrganizationResolver {
  constructor(private organizationService: OrganizationService) {}

  @Mutation((returns) => Organization)
  async CreateOrganization(@Args('createOrganizationInput') createOrganizationInput: CreateOrganizationInput) {
    return this.organizationService.createOrganization(createOrganizationInput);
  }
}
