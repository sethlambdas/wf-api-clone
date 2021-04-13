import { InputType, PartialType } from '@nestjs/graphql';
import { CreateWorkflowExecutionInput } from './create-workflow-execution.input';

@InputType()
export class SaveWorkflowExecutionInput extends PartialType(CreateWorkflowExecutionInput) {}
