import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateOrganizationInput } from './create-organization.input';

@InputType()
export class SaveOrganizationInput extends PartialType(CreateOrganizationInput) {
  @Field((type) => Int, { nullable: true })
  TotalWLF?: number;

  @Field((type) => Int, { nullable: true })
  TotalUSR?: number;
}
