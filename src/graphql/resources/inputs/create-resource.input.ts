import { Field, InputType } from '@nestjs/graphql';
import { QueryBuilderEnum } from '../../common/enums/db-query-builder.enum';

@InputType()
export class ConfigurationInput {
  @Field({ nullable: true })
  fieldName: string;

  @Field({ nullable: true })
  fieldValue: string;
}

@InputType()
export class CreateResourcesInput {
  @Field({ nullable: true })
  PK: string;

  @Field()
  name: string;

  @Field((type) => QueryBuilderEnum)
  database: QueryBuilderEnum;

  @Field((type) => [ConfigurationInput])
  configuration: ConfigurationInput[];
}
