import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CreateOrganizationApiKeyInput } from './inputs/create-organization-api-key.input';
import { CreateOrganizationInput } from './inputs/create-organization.input';
import { GetOrganizationApiKeyActiveInput } from './inputs/get-organization-api-key-active.input';
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
  async CreateOrganizationApiKey(
    @Args('createOrganizationApiKeyInput') createOrganizationApiKeyInput: CreateOrganizationApiKeyInput,
  ) {
    return this.organizationService.createOrganizationApiKey(createOrganizationApiKeyInput);
  }

  @Mutation((returns) => Organization)
  async GetOrganizationApiKeyActive(
    @Args('getOrganizationApiKeyActiveInput') getOrganizationApiKeyActiveInput: GetOrganizationApiKeyActiveInput,
  ) {
    return this.organizationService.getOrganizationApiKeyActive(getOrganizationApiKeyActiveInput);
  }
}
