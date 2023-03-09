import { Field, InputType, PartialType } from '@nestjs/graphql';

import { AuthType, ClientStatus } from '../../common/enums/authentication.enum';
import { MetadataSchema, SecretsSchema } from '../client.entity';
import { HeaderInput } from '../../integration-app/inputs/create-integration-app.inputs';
import { FileUploadType } from '../../integration-app/integration-app.enum';

@InputType()
export class SecretsInput extends PartialType(SecretsSchema, InputType) {}

@InputType()
export class MetadataInput extends PartialType(MetadataSchema, InputType) {}

@InputType()
export class CreateClientInput {
  @Field()
  appClient: string;

  @Field()
  orgId: string;

  @Field()
  integrationType: string;

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

  @Field((type) => SecretsInput)
  secrets: SecretsInput;

  @Field({ nullable: true })
  scopes?: string;

  @Field((type) => MetadataInput, { nullable: true })
  metadata?: MetadataInput;

  @Field((type) => [HeaderInput], { nullable: true })
  headers?: HeaderInput[];
}
