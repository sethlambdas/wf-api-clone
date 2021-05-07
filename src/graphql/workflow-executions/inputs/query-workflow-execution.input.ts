import { Field, InputType } from '@nestjs/graphql';

@InputType()
class PrimaryKey {
  @Field()
  PK: string;

  @Field()
  PKValue: string;

  @Field({ nullable: true })
  SK?: string;

  @Field({ nullable: true })
  SKValue?: string;
}

@InputType()
export class QueryWorkflowExecutionsInput {
  @Field((type) => PrimaryKey)
  primaryKey: PrimaryKey;

  @Field({ nullable: true })
  indexName?: string;
}
