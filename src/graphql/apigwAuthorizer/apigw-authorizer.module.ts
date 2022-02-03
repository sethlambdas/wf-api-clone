import { Module } from '@nestjs/common';
import { ApigwAuthorizerController } from './apigw-authorizer.controller';
import { ApigwAuthorizerRepository } from './apigw-authorizer.repository';

@Module({
  controllers: [ApigwAuthorizerController],
  providers: [ApigwAuthorizerRepository],
})
export class ApigwAuthorizerModule {}
