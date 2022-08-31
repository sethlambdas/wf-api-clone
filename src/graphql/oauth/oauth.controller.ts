import { Controller, Get, Req, Res } from '@nestjs/common';
import { OAuthService } from './oauth.service';

@Controller('oauth')
export class OAuthController {
  constructor(private oauthService: OAuthService) {}

  @Get('callback')
  async callbackOAuth(@Req() req, @Res() res) {
    return this.oauthService.callbackOAuth(req, res);
  }
}
