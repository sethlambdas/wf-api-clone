import { InputType, PartialType } from '@nestjs/graphql';

import { CreateWorkflowStepInput } from './post.inputs';

@InputType()
export class SaveWorkflowStepInput extends PartialType(CreateWorkflowStepInput) {}
