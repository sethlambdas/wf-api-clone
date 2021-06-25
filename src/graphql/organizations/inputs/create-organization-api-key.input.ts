import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateOrganizationApiKeyInput {
  @Field()
  PK: string;
}
