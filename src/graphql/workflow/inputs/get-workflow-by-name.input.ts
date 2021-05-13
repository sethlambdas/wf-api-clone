import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GetWorkflowByNameInput {
  @Field()
  OrgId: string;

  @Field()
  WorkflowName: string;
}
