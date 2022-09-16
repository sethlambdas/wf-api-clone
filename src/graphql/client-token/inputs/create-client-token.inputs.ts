import { Field, InputType, PartialType } from '@nestjs/graphql';

import { SimplePrimaryKey } from '../../common/interfaces/dynamodb-keys.interface';

@InputType()
export class CreateClientTokenInput implements SimplePrimaryKey {
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
