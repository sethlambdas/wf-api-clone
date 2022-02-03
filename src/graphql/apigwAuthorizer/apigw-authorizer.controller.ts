import { Body, Controller, Param, Post } from '@nestjs/common';

import { ApigwAuthorizer } from './apigw-authorizer.entity';
import { ApigwAuthorizerRepository } from './apigw-authorizer.repository';

@Controller('apigwAuthorizer')
export class ApigwAuthorizerController {
  constructor(private apigwAuthorizerRepository: ApigwAuthorizerRepository) {}

  @Post('find')
  findApigwAuthorizer(@Param() params: string[], @Body() payload: any): Promise<ApigwAuthorizer> {
    return this.apigwAuthorizerRepository.findApigwAuthorizerByPk(payload);
  }

  @Post('create')
  createApigwAuthorizer(@Param() params: string[], @Body() payload: any): Promise<ApigwAuthorizer> {
    return this.apigwAuthorizerRepository.createApigwAuthorizerByPk(payload);
  }
}
