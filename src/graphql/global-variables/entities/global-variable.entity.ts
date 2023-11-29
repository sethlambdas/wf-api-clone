import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { SimplePrimaryKey } from '../../common/interfaces/dynamodb-keys.interface';
@ObjectType()
export class EnvironmentValues {
  @Field()
  fieldName: string;
  @Field()
  fieldValue: string;
  @Field({ nullable: true })
  default?: boolean;
}

@ObjectType()
export class GlobalVariable implements SimplePrimaryKey {
  @Field()
  PK: string;

  @Field((type) => [EnvironmentValues])
  environmentValues: EnvironmentValues[];
}
