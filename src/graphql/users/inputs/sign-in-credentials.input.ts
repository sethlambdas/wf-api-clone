import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SignInCredentialsInput {
  @Field()
  email: string;

  @Field()
  password: string;
}
