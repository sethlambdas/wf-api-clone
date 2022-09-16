import { Field, Int, ObjectType } from '@nestjs/graphql';

import { CompositePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';

@ObjectType()
export class EntityCount implements CompositePrimaryKey {
  @Field()
  PK: string;

  @Field()
  SK: string;

  @Field((type) => Int)
  totalIntApp: number;
}
