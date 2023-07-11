import { SimplePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class User implements SimplePrimaryKey {
  @Field()
  PK: string;

  @Field()
  name: string;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  salt: string;

  @Field()
  stripeCustomerId?: string;

  @Field()
  subscriptionId?: string;
}

export class CookieOptions {
  httpOnly: boolean;
  maxAge: string;
}

export class RefreshToken {
  accessToken: string;
  refreshTokenGenerate: string;
  cookieOptions: CookieOptions;
}

export interface IRefreshToken {
  data: {
    RefreshToken: RefreshToken;
  };
}

export interface ISignOut {
  data: {
    SignOut: boolean;
  };
}
