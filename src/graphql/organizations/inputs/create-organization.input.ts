import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateOrganizationInput {
  @Field()
  orgName: string;
}
