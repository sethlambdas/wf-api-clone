import { Field, Int, ObjectType } from '@nestjs/graphql';

import { CompositePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { AuthType } from '../common/enums/authentication.enum';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from './integration-app.enum';

@ObjectType()
export class Header {
  @Field({ nullable: true })
  fieldName?: string;

  @Field({ nullable: true })
  fieldValue?: string;
}

@ObjectType()
export class AdditionalConfiguration {
  @Field({ nullable: true })
  fieldName?: string;

  @Field({ nullable: true })
  fieldValue?: string;
}

@ObjectType()
export class Urls {
  @Field({ nullable: true })
  authorize?: string;

  @Field({ nullable: true })
  token?: string;

  @Field({ nullable: true })
  refreshToken?: string;
}

@ObjectType()
export class IntegrationApp implements CompositePrimaryKey {
  @Field()
  PK: string;

  @Field()
  SK: string;

  @Field()
  name: string;

  @Field((type) => AuthType)
  type: AuthType;

  @Field((type) => Int)
  version: number;

  @Field((type) => Urls, { nullable: true })
  urls?: Urls;

  @Field((type) => [String], { nullable: true })
  scopes?: string[];

  @Field((type) => String, { nullable: true })
  cookieName?: string;

  @Field((type) => String, { nullable: true })
  grantType?: string;

  @Field((type) => String, { nullable: true })
  authMethod?: string;

  @Field((type) => [Header], { nullable: true })
  headers?: Header[];

  @Field((type) => FileUploadType, { nullable: true })
  fileUploadType?: FileUploadType;

  @Field((type) => [AdditionalConfiguration], { nullable: true })
  additionalConfiguration?: AdditionalConfiguration[];

  @Field((type) => String, { nullable: true })
  orgId?: string;

  @Field((type) => [AdditionalConfiguration], { nullable: true })
  apiKeyConfiguration?: AdditionalConfiguration[];

  @Field((type) => String, { nullable: true })
  addTo?: string;
}

export interface IListIntegrationApps {
  data: {
    ListIntegrationApps: IntegrationApp[];
  };
}
