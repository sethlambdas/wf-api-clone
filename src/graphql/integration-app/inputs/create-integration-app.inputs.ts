import { Field, InputType, Int, PartialType } from '@nestjs/graphql';

import { AdditionalConfiguration, Header, Urls } from '../integration-app.entity';
import { AuthType } from '../../common/enums/authentication.enum';
import { ClientIntegrationDetailsPlacementOption, FileUploadType } from '../integration-app.enum';

@InputType()
export class HeaderInput extends PartialType(Header, InputType) { }

@InputType()
export class AdditionalConfigurationInput extends PartialType(AdditionalConfiguration, InputType) { }

@InputType()
export class UrlsInput extends PartialType(Urls, InputType) { }

@InputType()
export class CreateIntegrationAppInput {
  @Field()
  name: string;

  @Field((type) => AuthType)
  type: AuthType;

  @Field((type) => Int)
  version: number;

  @Field((type) => UrlsInput, { nullable: true })
  urls?: UrlsInput;

  @Field((type) => [String], { nullable: true })
  scopes?: string[];

  @Field((type) => [String], { nullable: true })
  cookieName?: string;

  @Field((type) => [HeaderInput], { nullable: true })
  headers?: HeaderInput[];

  @Field((type) => FileUploadType, { nullable: true })
  fileUploadType?: FileUploadType;

  @Field((type) => String, { nullable: true })
  addTo?: string;

  @Field((type) => [AdditionalConfigurationInput], { nullable: true })
  apiKeyConfiguration?: AdditionalConfigurationInput[];

  @Field((type) => String, { nullable: true })
  orgId?: string;

  @Field((type) => String, { nullable: true })
  grantType?: string;

  @Field((type) => String, { nullable: true })
  authMethod?: string;

  @Field((type) => [AdditionalConfigurationInput], { nullable: true })
  additionalConfiguration?: AdditionalConfigurationInput[];
}
