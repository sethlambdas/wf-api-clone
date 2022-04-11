import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateWorkflowStepExecutionHistoryInput } from './post.inputs';

@InputType()
export class SaveWorkflowStepExecutionHistoryInput extends PartialType(CreateWorkflowStepExecutionHistoryInput) {}
