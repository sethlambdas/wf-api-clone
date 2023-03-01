import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { CreateResourcesInput } from './inputs/create-resource.input';
import { Resources } from './resources.entity';
import { ResourcesService } from './resources.service';

@Resolver((of) => Resources)
export class ResourcesResolver {
  constructor(private resourcesService: ResourcesService) {}

  @Mutation((returns) => Resources, { nullable: true })
  async CreateResources(
    @Args('createResourcesInput') createResourcesInput: CreateResourcesInput,
  ): Promise<Resources | null> {
    return this.resourcesService.createResource(createResourcesInput);
  }

  @Mutation((returns) => Resources, { nullable: true })
  async UpdateResources(
    @Args('PK') PK: string,
    @Args('updateResourcesInput') createResourcesInput: CreateResourcesInput,
  ): Promise<Resources | null> {
    return this.resourcesService.updateResource(PK, createResourcesInput);
  }

  @Query((returns) => [Resources], { nullable: true })
  async GetAllResources(): Promise<Resources[]> {
    return this.resourcesService.getAllResources();
  }

  @Query((returns) => Resources, { nullable: true })
  async GetResourceByPK(@Args('PK') PK: string): Promise<Resources | null> {
    return this.resourcesService.getResourceByPK(PK);
  }
}
