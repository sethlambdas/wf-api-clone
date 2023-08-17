import { Body, Controller, Get, Inject, Injectable, Logger, Param, Post, Res, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import { UserRepository } from './user.repository';

@Controller('user')
@Injectable({ scope: Scope.REQUEST })
export class UserController {
  constructor(private userRepository: UserRepository, @Inject(CONTEXT) private context) {}

  @Post('refreshToken')
  refreshToken(@Res() res: any, @Param() params: string[], @Body() payload: any) {
    return this.userRepository.refreshToken(res, this.context?.cookies?.refreshToken);
  }

  @Post('apiKeyValue')
  apiKeyValue(@Res() res: any, @Body() payload: any) {
    return this.userRepository.apiKeyValue(res, payload);
  }

  @Get('something')
  something() {
    return 'somehtning';
  }

  @Post('logout')
  async logout(@Res() res: any, @Param() params: string[], @Body() payload: any) {
    return this.userRepository.logout(res);
  }
}
