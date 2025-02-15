import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ForgotPasswordInput {
  @Field()
  email: string;

  @Field({ nullable: true })
  origin?: string;
}
