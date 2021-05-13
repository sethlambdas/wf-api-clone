import { InputType, PartialType } from '@nestjs/graphql';
import { MDInput } from '../../common/entities/workflow-step.entity';

@InputType()
export class VariableWorkflowInput extends PartialType(MDInput) {}
