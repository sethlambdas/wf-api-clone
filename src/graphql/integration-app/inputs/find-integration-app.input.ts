import { Field, InputType } from '@nestjs/graphql';

import { CompositePrimaryKey } from '@graphql:common/interfaces/dynamodb-keys.interface';

@InputType()
export class FindIntegrationAppByNameInput {
  @Field()
  name: string;
}

@InputType()
export class FindIntegrationAppByPKInput implements CompositePrimaryKey {
  @Field()
  PK: string;

  @Field()
  SK: string;
}
