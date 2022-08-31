import { Field, ObjectType, PartialType } from '@nestjs/graphql';

import { SimplePrimaryKey } from '@graphql:common/interfaces/dynamodb-keys.interface';

@ObjectType()
export class ClientToken implements SimplePrimaryKey {
  @Field()
  PK: string;

  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field()
  expTime: number;

  @Field()
  clientPK: string;
}

@ObjectType()
export class ListALLClientTokenResponse extends PartialType(ClientToken) {
  @Field()
  updated_at: number;
}
