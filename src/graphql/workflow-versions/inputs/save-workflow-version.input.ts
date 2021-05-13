import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateWorkflowVersionInput } from './create-workflow-version.input';
@InputType()
export class SaveWorkflowVersionInput extends PartialType(CreateWorkflowVersionInput) {
  @Field((type) => Int, { nullable: true })
  TotalEXC?: number;
}
