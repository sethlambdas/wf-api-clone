import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ListWorkflowExecutionsOfAVersionInput {
  @Field()
  OrgId: string;

  @Field()
  workflowVersionSK: string;
}
