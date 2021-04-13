import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateWorkflowExecutionInput {
  @Field()
  WSID: string;

  @Field()
  CAT: string;

  @Field()
  STE: string;
}
