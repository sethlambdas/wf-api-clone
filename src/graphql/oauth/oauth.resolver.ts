import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ConnectOAuthInput, RefreshOAuthInput } from './inputs/connect-oauth.input';
import { OAuthService } from './oauth.service';
import { ClientToken } from '../../graphql/client-token/client-token.entity';

@Resolver()
export class OAuthResolver {
  constructor(private oauthService: OAuthService) {}

  @Query((returns) => String, { nullable: true })
  async ConnectOAuth(@Args('connectOAuthInput') connectOAuthInput: ConnectOAuthInput) {
    return this.oauthService.connectOAuth(connectOAuthInput);
  }

  @Mutation((returns) => ClientToken, { nullable: true })
  async OAuthRefreshToken(@Args('refreshOAuthInput') refreshOAuthInput: RefreshOAuthInput): Promise<ClientToken> {
    return this.oauthService.getRefreshToken({
      clientPK: refreshOAuthInput.clientPK,
      clientSK: refreshOAuthInput.clientSK,
    });
  }
}
