import { SimplePrimaryKey } from '@graphql:common/interfaces/dynamodb-keys.interface';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Organization implements SimplePrimaryKey {
  @Field()
  PK: string;

  @Field()
  ORGNAME: string;

  @Field((type) => Int)
  TotalWLFBatches: number;

  @Field((type) => Int)
  TotalUSR: number;
}
