import { DynamoDBModule } from '@graphql:dynamodb/dynamodb.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ConfigUtil } from '@lambdascrew/utility';

import { OrganizationModule } from '../organizations/organization.module';
import { JwtStrategy } from './auth/jwt.strategy';
import { UserRepository } from './user.repository';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { UserController } from './user.controller';
// import { DynamoDBModule } from '../dynamodb/dynamodb.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: ConfigUtil.get('jwt.secret'),
      signOptions: {
        expiresIn: ConfigUtil.get('jwt.accessToken.expiresIn'),
      },
    }),
    DynamoDBModule,
    OrganizationModule,
  ],
  controllers: [UserController],
  providers: [JwtStrategy, UserResolver, UserService, UserRepository],
  exports: [PassportModule, JwtStrategy, UserService],
})
export class UserModule {}
