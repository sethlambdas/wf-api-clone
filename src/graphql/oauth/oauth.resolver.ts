import { Args, Query, Resolver } from '@nestjs/graphql';
import { ConnectOAuthInput } from './inputs/connect-oauth.input';
import { OAuthService } from './oauth.service';

@Resolver()
export class OAuthResolver {
  constructor(private oauthService: OAuthService) {}

  @Query((returns) => String, { nullable: true })
  async ConnectOAuth(@Args('connectOAuthInput') connectOAuthInput: ConnectOAuthInput) {
    return this.oauthService.connectOAuth(connectOAuthInput);
  }
}
