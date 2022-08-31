import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateOrganizationInput {
  @Field()
  ORGNAME: string;

  @Field({ nullable: true })
  ORGID?: string;
}
