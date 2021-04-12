import { InputType, PartialType } from '@nestjs/graphql';
import { CreateWorkflowVersionInput } from './create-workflow-version.input';

@InputType()
export class SaveWorkflowVersionInput extends PartialType(CreateWorkflowVersionInput) {}
