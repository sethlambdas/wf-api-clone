import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class LoginDocuwareInput {
  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  password?: string;

  @Field({ nullable: true })
  organisation?: string;

  @Field({ nullable: true })
  hostId?: string;

  @Field({ nullable: true })
  rootUrl?: string;

  @Field({ nullable: true })
  cookie?: string;
}
