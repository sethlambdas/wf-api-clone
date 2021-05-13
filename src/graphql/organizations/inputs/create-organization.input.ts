import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateOrganizationInput {
  @Field()
  orgName: string;

  @Field({ nullable: true })
  orgId?: string;
}
