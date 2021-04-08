import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateWorkflowSpecInput {
  @Field()
  WVID: string;

  @Field()
  WID: string;
}
