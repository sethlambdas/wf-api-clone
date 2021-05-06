/* tslint:disable:max-classes-per-file */
import { Field, InputType, Int } from '@nestjs/graphql';
import { VariableWorkflowInput } from './variable-workflow.input';

@InputType()
class LabelInput {
  @Field()
  iconName: string;

  @Field()
  name: string;
}

@InputType()
class DataInput {
  @Field((type) => LabelInput, { nullable: true })
  label?: LabelInput;

  @Field()
  nodeType: string;

  @Field({ nullable: true })
  labelIconName: string;

  @Field()
  state: string;

  @Field((type) => VariableWorkflowInput, { nullable: true })
  variables?: VariableWorkflowInput;
}

@InputType()
class PositionInput {
  @Field((type) => Int)
  x: number;

  @Field((type) => Int)
  y: number;
}

@InputType()
export class DesignWorkflowInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  source?: string;

  @Field({ nullable: true })
  target?: string;

  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  style?: string;

  @Field((type) => DataInput, { nullable: true })
  data?: DataInput;

  @Field((type) => PositionInput, { nullable: true })
  position?: PositionInput;
}
