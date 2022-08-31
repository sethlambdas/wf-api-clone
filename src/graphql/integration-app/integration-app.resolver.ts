import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CreateIntegrationAppInput } from './inputs/create-integration-app.inputs';
import { FindIntegrationAppByNameInput, FindIntegrationAppByPKInput } from './inputs/find-integration-app.input';
import { ListIntegrationAppRecordsInput } from './inputs/list-integration-app.input';
import { IntegrationApp } from './integration-app.entity';
import { IntegrationAppService } from './integration-app.service';

@Resolver((of) => IntegrationApp)
export class IntegrationAppResolver {
  constructor(private integrationAppService: IntegrationAppService) {}

  @Query((returns) => IntegrationApp, { nullable: true })
  async FindIntegrationAppByPK(
    @Args('findIntegrationAppByPKInput') findIntegrationAppByPKInput: FindIntegrationAppByPKInput,
  ): Promise<IntegrationApp | null> {
    return this.integrationAppService.findIntegrationAppByPK(findIntegrationAppByPKInput);
  }

  @Query((returns) => IntegrationApp, { nullable: true })
  async FindIntegrationAppByName(
    @Args('findIntegrationAppByNameInput') findIntegrationAppByNameInput: FindIntegrationAppByNameInput,
  ): Promise<IntegrationApp | null> {
    return this.integrationAppService.findIntegrationAppByName(findIntegrationAppByNameInput.name);
  }

  @Mutation((returns) => IntegrationApp, { nullable: true })
  async CreateIntegrationApp(
    @Args('createIntegrationAppInput') createIntegrationAppInput: CreateIntegrationAppInput,
  ): Promise<IntegrationApp | null> {
    return this.integrationAppService.createIntegrationApp(createIntegrationAppInput);
  }

  @Query((returns) => [IntegrationApp], { nullable: true })
  async ListIntegrationApps(
    @Args('listIntegrationAppRecordsInput') listIntegrationAppRecordsInput: ListIntegrationAppRecordsInput,
  ) {
    return this.integrationAppService.listIntegrationAppRecords(listIntegrationAppRecordsInput);
  }
}
