import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class InviteUserInput {
  @Field()
  email: string;

  @Field({ nullable: true })
  orgId: string;
}
