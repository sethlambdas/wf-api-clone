import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateOrganizationInput } from './inputs/create-organization.input';
import { GetOrganizationInput } from './inputs/get-organization.input';
import { SaveOrganizationInput } from './inputs/save-organization.input';
import { Organization } from './organization.entity';
import { OrganizationService } from './organization.service';

@Resolver((of) => Organization)
export class OrganizationResolver {
  constructor(private organizationService: OrganizationService) {}

  @Mutation((returns) => Organization)
  async CreateOrganization(@Args('createOrganizationInput') createOrganizationInput: CreateOrganizationInput) {
    return this.organizationService.createOrganization(createOrganizationInput);
  }

  @Mutation((returns) => Organization)
  async SaveOrganization(@Args('saveOrganizationInput') saveOrganizationInput: SaveOrganizationInput) {
    return this.organizationService.saveOrganization(saveOrganizationInput);
  }

  @Query((returns) => Organization, { nullable: true })
  async GetOrganization(@Args('getOrganizationInput') getOrganizationInput: GetOrganizationInput) {
    return this.organizationService.getOrganization(getOrganizationInput);
  }
}
