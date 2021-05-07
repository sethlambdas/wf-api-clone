import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GetWorkflowDetailsInput {
  @Field()
  OrgId: string;

  @Field()
  WorkflowVersionSK: string;
}
