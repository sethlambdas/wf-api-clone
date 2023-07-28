import { Field, ObjectType } from '@nestjs/graphql';
import { UserRoleEnum } from '../../common/enums/user-roles.enum';

@ObjectType()
export class CookieOptions {
  @Field({ nullable: true })
  httpOnly?: boolean;

  @Field({ nullable: true })
  maxAge?: string;
}

@ObjectType()
export class AuthCredentials {
  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  refreshTokenGenerate?: string;

  @Field((type) => CookieOptions, { nullable: true })
  cookieOptions?: CookieOptions;
}

@ObjectType()
export class RefreshTokenResult {
  @Field({ nullable: true })
  orgId: string;

  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  refreshTokenGenerate?: string;

  @Field((type) => CookieOptions, { nullable: true })
  cookieOptions?: CookieOptions;
}