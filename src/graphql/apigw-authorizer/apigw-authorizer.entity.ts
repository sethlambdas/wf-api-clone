import { Field, ObjectType } from '@nestjs/graphql';

import { SimplePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';

@ObjectType()
export class CredentialsSchema {
  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  password?: string;

  @Field({ nullable: true })
  headerName?: string;

  @Field({ nullable: true })
  headerValue?: string;
}

@ObjectType()
export class ApigwAuthorizer implements SimplePrimaryKey {
  @Field()
  PK: string;

  @Field()
  type: string;

  @Field()
  httpMethod: string;

  @Field((type) => CredentialsSchema, { nullable: true })
  credentials?: CredentialsSchema;
}
