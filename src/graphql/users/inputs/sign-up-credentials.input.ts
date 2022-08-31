import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SignUpCredentialsInput {
  @Field()
  name: string;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  orgName: string;
}
