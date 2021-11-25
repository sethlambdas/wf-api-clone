import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { DesignWorkflowInput } from '../../common/entities/workflow-step.entity';
import { WorkflowModelRepository } from '../workflow.entity';
import { StateWorkflowInput } from './state-workflow.input';

@InputType()
export class SaveWorkflowInput extends PartialType(WorkflowModelRepository, InputType) {}
