import { Field, ObjectType, PartialType } from '@nestjs/graphql';

import { SimplePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';

@ObjectType()
export class TimestampSchema {
  @Field({ nullable: true })
  createdAt?: number;

  @Field({ nullable: true })
  updatedAt?: number;
}
@ObjectType()
export class ClientToken implements SimplePrimaryKey {
  @Field()
  PK: string;

  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field((type) => Number, { nullable: true })
  expTime?: number;

  @Field()
  clientPK: string;

  @Field((type) => TimestampSchema, { nullable: true })
  timestamp?: TimestampSchema;
}

@ObjectType()
export class ListALLClientTokenResponse extends PartialType(ClientToken) {
  @Field()
  updated_at: number;
}
