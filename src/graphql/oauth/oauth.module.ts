import { Module } from '@nestjs/common';
import { ClientTokenModule } from '../client-token/client-token.module';
import { ClientModule } from '../client/client.module';
import { IntegrationAppModule } from '../integration-app/integration-app.module';
import { OAuthController } from './oauth.controller';

import { OAuthResolver } from './oauth.resolver';
import { OAuthService } from './oauth.service';

@Module({
  imports: [ClientModule, ClientTokenModule, IntegrationAppModule],
  controllers: [OAuthController],
  providers: [OAuthResolver, OAuthService],
})
export class OAuthModule {}
