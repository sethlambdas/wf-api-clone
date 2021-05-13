import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateWorkflowStepExecutionHistoryInput } from './create.input';

@InputType()
export class SaveWorkflowStepExecutionHistoryInput extends PartialType(CreateWorkflowStepExecutionHistoryInput) {}
