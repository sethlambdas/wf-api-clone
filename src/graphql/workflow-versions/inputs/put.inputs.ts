import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CompositePrimaryKeyInput } from '../../common/inputs/workflow-key.input';
import { CreateWorkflowVersionInput } from './post.inputs';

@InputType()
export class SaveWorkflowVersionInput extends PartialType(CreateWorkflowVersionInput) {
  @Field((type) => Int, { nullable: true })
  TotalEXC?: number;
}