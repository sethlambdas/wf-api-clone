/* tslint:disable:max-classes-per-file */
import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
class LabelInput {
  @Field()
  iconName: string;

  @Field()
  name: string;
}

@InputType()
class DataInput {
  @Field((type) => LabelInput)
  label: LabelInput;

  @Field()
  nodeType: string;

  @Field()
  state: string;
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
