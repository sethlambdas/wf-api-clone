import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class WorkflowKeysInput {
  @Field()
  PK: string;

  @Field()
  SK: string;
}
