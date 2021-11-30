import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GetWorkflowByUniqueKeyInput {
  @Field()
  UniqueKey: string;
}
