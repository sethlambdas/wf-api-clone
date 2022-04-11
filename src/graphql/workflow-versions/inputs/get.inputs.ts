import { Field, InputType, PartialType } from '@nestjs/graphql';
import { ListDynamoSearchInput } from '../../dynamodb/inputs/get.inputs';

@InputType()
export class GetWorkflowVersionDetailsInput {
  @Field()
  WorkflowVersionSK: string;
}

@InputType()
export class ListAllWorkflowVersionsOfWorkflowInput extends PartialType(ListDynamoSearchInput) {
  @Field()
  WorkflowPK: string;

  @Field({ nullable: true })
  LastKey?: string;
}