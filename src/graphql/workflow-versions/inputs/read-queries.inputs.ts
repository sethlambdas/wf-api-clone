import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GetAllWorkflowVersionsOfWorkflowInput {
  @Field()
  WorkflowPK: string;
}
