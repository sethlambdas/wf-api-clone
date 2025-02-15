import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CompositePrimaryKeyInput {
  @Field()
  PK: string;

  @Field()
  SK: string;
}
