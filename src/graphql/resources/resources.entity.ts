import { SimplePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { Field, ObjectType } from '@nestjs/graphql';
import { QueryBuilderEnum } from '../common/enums/db-query-builder.enum';

@ObjectType()
export class Configuration {
  @Field({ nullable: true })
  fieldName: string;

  @Field({ nullable: true })
  fieldValue: string;
}

@ObjectType()
export class Resources implements SimplePrimaryKey {
  @Field()
  PK: string;

  @Field()
  name: string;

  @Field((type) => QueryBuilderEnum)
  database: QueryBuilderEnum;

  @Field((type) => [Configuration])
  configuration: Configuration[];
}
