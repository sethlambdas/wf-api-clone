import { InputType, PartialType } from '@nestjs/graphql';
import { CreateWorkflowSpecInput } from './create-workflow-spec.input';

@InputType()
export class SaveWorkflowSpecInput extends PartialType(CreateWorkflowSpecInput) {}
