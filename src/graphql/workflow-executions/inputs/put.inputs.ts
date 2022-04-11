import { InputType, PartialType } from '@nestjs/graphql';
import { CreateWorkflowExecutionInput } from './post.inputs';

@InputType()
export class SaveWorkflowExecutionInput extends PartialType(CreateWorkflowExecutionInput) {}
