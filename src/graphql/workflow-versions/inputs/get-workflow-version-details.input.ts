import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GetWorkflowVersionDetailsInput {
  @Field()
  WorkflowVersionSK: string;
}
