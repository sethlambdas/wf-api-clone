import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GlobalVariableInput {
  @Field({ nullable: true })
  PK: string;

  @Field((type) => [EnvironmentValuesInput])
  environmentValues: EnvironmentValuesInput[];
}

@InputType()
export class UpdateGlobalVariableInput {
  @Field()
  fieldName: string;

  @Field((type) => [EnvironmentValuesInput])
  environmentValues: EnvironmentValuesInput[];
}

@InputType()
export class EnvironmentValuesInput {
  @Field()
  fieldName: string;
  @Field()
  fieldValue: string;
  @Field({ nullable: true })
  default?: boolean;
}
