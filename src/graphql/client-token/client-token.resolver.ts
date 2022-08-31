import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { ClientToken, ListALLClientTokenResponse } from './client-token.entity';
import { ClientTokenService } from './client-token.service';
import { CreateClientTokenInput } from './inputs/create-client-token.inputs';
import { FindClientTokenByPkInput } from './inputs/find-client-token.input';
import { UpdateClientTokenInput } from './inputs/update-client-token.input';

@Resolver((of) => ClientToken)
export class ClientTokenResolver {
  constructor(private clientTokenService: ClientTokenService) {}

  @Query((returns) => ClientToken, { nullable: true })
  async FindClientTokenByPK(
    @Args('findClientTokenByPkInput') findClientTokenByPkInput: FindClientTokenByPkInput,
  ): Promise<ClientToken | null> {
    return this.clientTokenService.findClientTokenByPK(findClientTokenByPkInput);
  }

  @Query((returns) => [ListALLClientTokenResponse], { nullable: true })
  async ListAllClientTokens(): Promise<ClientToken[]> {
    return this.clientTokenService.scanClientTokenRecords();
  }

  @Mutation((returns) => ClientToken, { nullable: true })
  async CreateClientToken(
    @Args('createClientTokenInput') createClientTokenInput: CreateClientTokenInput,
  ): Promise<ClientToken | null> {
    return this.clientTokenService.createClientToken(createClientTokenInput);
  }

  @Mutation((returns) => ClientToken, { nullable: true })
  async UpdateClientToken(
    @Args('updateClientTokenInput') updateClientTokenInput: UpdateClientTokenInput,
  ): Promise<ClientToken> {
    return this.clientTokenService.updateClientTokenByPK(
      { PK: updateClientTokenInput.PK },
      updateClientTokenInput.clientToken,
    );
  }
}
