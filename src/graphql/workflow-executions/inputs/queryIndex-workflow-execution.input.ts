import { Field, InputType, PartialType } from '@nestjs/graphql';
import { PaginationInput } from '../../common/inputs/pagination.input';
import { LastKey } from '../workflow-execution.entity';

@InputType()
export class LastKeyInput extends PartialType(LastKey, InputType) {}

@InputType()
export class QueryIndexWorkflowExecutionInput extends PartialType(PaginationInput) {
  @Field()
  IndexName: string;

  @Field()
  PK: string;

  @Field()
  Value: string;

  @Field((type) => LastKeyInput, { nullable: true })
  LastKey?: LastKeyInput;
}
