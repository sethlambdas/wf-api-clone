import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GetWorkflowDetailsInput {
  @Field()
  WID: string;

  @Field({ nullable: true })
  WVID?: string;
}
