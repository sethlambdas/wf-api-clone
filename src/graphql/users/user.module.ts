import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigUtil } from '../../utils/config.util';
import { JwtStrategy } from './auth/jwt.strategy';
import { UserRepository } from './user.repository';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: ConfigUtil.get('jwt.secret'),
      signOptions: {
        expiresIn: ConfigUtil.get('jwt.accessToken.expiresIn'),
      },
    }),
    TypeOrmModule.forFeature([UserRepository]),
  ],
  providers: [JwtStrategy, UserResolver, UserService],
  exports: [PassportModule, JwtStrategy, UserService],
})
export class UserModule {}
