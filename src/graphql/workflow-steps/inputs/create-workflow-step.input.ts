/* tslint:disable:max-classes-per-file */
import { Field, InputType, OmitType } from '@nestjs/graphql';
import { ChoiceWorkflowInput } from '../../workflow/inputs/choice-workflow.input';
import { DesignWorkflowInput } from '../../workflow/inputs/design-workflow.input';
import { VariableWorkflowInput } from '../../workflow/inputs/variable-workflow.input';
import { ACT } from '../workflow-step.entity';

@InputType()
class MDInput extends OmitType(VariableWorkflowInput, ['Choices'] as const) {
  // Conditional
  @Field((type) => [ChoiceWorkflowInput], { nullable: true })
  Choices?: ChoiceWorkflowInput[];
}

@InputType()
export class ACTInput extends OmitType(ACT, ['DESIGN', 'MD'] as const, InputType) {
  @Field((type) => MDInput)
  MD: MDInput;

  @Field((type) => [DesignWorkflowInput])
  DESIGN: DesignWorkflowInput[];
}

@InputType()
export class CreateWorkflowStepInput {
  @Field()
  WVID: string;

  @Field((type) => [String])
  NAID: string[];

  @Field()
  AID: string;

  @Field((type) => ACTInput)
  ACT: ACTInput;
}
