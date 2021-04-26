import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { ACTInput } from '../../workflow-steps/inputs/create-workflow-step.input';

@InputType()
class CATInput extends PartialType(ACTInput) {
  @Field()
  Status: string;
}

@InputType()
export class CreateWorkflowExecutionInput {
  @Field({ nullable: true })
  WVID?: string;

  @Field({ nullable: true })
  WSID?: string;

  @Field((type) => [CATInput], { nullable: true })
  CAT?: CATInput[];

  @Field({ nullable: true })
  STE?: string;

  @Field(() => Boolean, { nullable: true })
  isParallel?: boolean;

  @Field(() => Int, { nullable: true })
  totalParallelCount?: number;

  @Field(() => Int, { nullable: true })
  finishedParallelCount?: number;
}
