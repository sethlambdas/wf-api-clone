import { Field, InputType, PartialType } from '@nestjs/graphql';
import { ListDynamoSearchInput } from '../../dynamodb/inputs/list-dynamo-search.input';

@InputType()
export class ListAllWorkflowVersionsOfWorkflowInput extends PartialType(ListDynamoSearchInput) {
  @Field()
  WorkflowPK: string;

  @Field({ nullable: true })
  LastKey?: string;
}
