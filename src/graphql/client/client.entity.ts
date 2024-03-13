import { Field, ObjectType } from '@nestjs/graphql';
import { FileUploadType } from '../integration-app/integration-app.enum';

import { AuthType, ClientStatus } from '../common/enums/authentication.enum';
import { CompositePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { Header } from '../integration-app/integration-app.entity';

@ObjectType()
export class SecretsSchema {
  @Field({ nullable: true })
  apiKey?: string;

  @Field({ nullable: true })
  clientId?: string;

  @Field({ nullable: true })
  clientSecret?: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  password?: string;

  @Field({ nullable: true })
  organisation?: string;

  @Field({ nullable: true })
  hostId?: string;

  @Field({ nullable: true })
  rootUrl?: string;

  @Field({ nullable: true })
  cookie?: string;

  @Field({ nullable: true })
  accessKey?: string;

  @Field({ nullable: true })
  secretKey?: string;
}

@ObjectType()
export class MetadataSchema {
  @Field({ nullable: true })
  shopifyStore?: string;
}

@ObjectType()
export class Client implements CompositePrimaryKey {
  @Field()
  PK: string;

  @Field()
  SK: string;

  @Field()
  name: string;

  @Field((type) => AuthType)
  type: AuthType;

  @Field((type) => FileUploadType, { nullable: true })
  fileUploadType?: FileUploadType;

  @Field((type) => ClientStatus)
  status: ClientStatus;

  @Field()
  intAppId: string;

  @Field((type) => SecretsSchema)
  secrets: SecretsSchema;

  @Field((type) => [String], { nullable: true })
  scopes?: string[];

  @Field((type) => MetadataSchema, { nullable: true })
  metadata?: MetadataSchema;

  @Field((type) => [Header], { nullable: true })
  headers?: Header[];

  @Field((type) => [Header], { nullable: true })
  apiKeyConfigurations?: Header[];
}
export interface IListClients {
  data: {
    ListClients: Client[];
  };
}
