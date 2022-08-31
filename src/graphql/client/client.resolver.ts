import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Client } from './client.entity';
import { ClientService } from './client.service';
import { CreateClientInput } from './inputs/create-client.input';
import { FindClientByNameInput, FindClientByPkInput, ListClientsInput } from './inputs/find-client.input';

@Resolver((of) => Client)
export class ClientResolver {
  constructor(private clientService: ClientService) {}

  @Query((returns) => Client, { nullable: true })
  async FindClientByPK(@Args('findClientByPkInput') findClientByPkInput: FindClientByPkInput): Promise<Client | null> {
    return this.clientService.findClientByPK(findClientByPkInput);
  }

  @Query((returns) => Client, { nullable: true })
  async FindClientByName(
    @Args('findClientByNameInput') findClientByNameInput: FindClientByNameInput,
  ): Promise<Client | null> {
    return this.clientService.findClientByName(findClientByNameInput);
  }

  @Query((returns) => [Client], { nullable: true })
  async ListClients(@Args('listClientsInput') listClientsInput: ListClientsInput): Promise<Client[]> {
    return this.clientService.listClient(listClientsInput);
  }

  @Mutation((returns) => Client, { nullable: true })
  async CreateClient(@Args('createClientInput') createClientInput: CreateClientInput): Promise<Client | null> {
    return this.clientService.createClient(createClientInput);
  }
}
