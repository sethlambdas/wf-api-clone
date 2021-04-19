import { InputType, PartialType } from '@nestjs/graphql';
import { CreateWorkflowStepInput } from './create-workflow-step.input';

@InputType()
export class SaveWorkflowStepInput extends PartialType(CreateWorkflowStepInput) {}
