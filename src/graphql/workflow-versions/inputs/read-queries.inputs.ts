import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GetAllWorkflowVersionsOfWorkflowInput {
  @Field()
  PK: string;

  @Field()
  WLFID: string;
}
