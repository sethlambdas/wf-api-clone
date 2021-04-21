import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateWorkflowExecutionInput {
  @Field({ nullable: true })
  WVID?: string;

  @Field({ nullable: true })
  WSID?: string;

  @Field({ nullable: true })
  CAT?: string;

  @Field({ nullable: true })
  STE?: string;

  @Field(() => Boolean, { nullable: true })
  isParallel?: boolean;

  @Field(() => Int, { nullable: true })
  totalParallelCount?: number;

  @Field(() => Int, { nullable: true })
  finishedParallelCount?: number;
}
