import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DocuwareClient } from './docuware.entity';

import { DocuwareService } from './docuware.service';
import { CreateDocuwareClientInput } from './inputs/create-docuware-client.input';

@Resolver()
export class DocuwareResolver {
  constructor(private docuwareService: DocuwareService) {}

  @Mutation((returns) => DocuwareClient, { nullable: true })
  async CreateDocuwareClient(
    @Args('createDocuwareClientInput') createDocuwareClientInput: CreateDocuwareClientInput,
  ): Promise<DocuwareClient> {
    return this.docuwareService.createDocuwareClient(createDocuwareClientInput);
  }
}
