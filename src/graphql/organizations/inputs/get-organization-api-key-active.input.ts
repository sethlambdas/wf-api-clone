import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GetOrganizationApiKeyActiveInput {
  @Field()
  PK: string;
}
