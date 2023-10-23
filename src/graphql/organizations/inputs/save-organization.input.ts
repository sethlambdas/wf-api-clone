import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class SaveOrganizationInput {
  @Field()
  PK: string;

  @Field({ nullable: true })
  ORGNAME?: string;

  @Field((type) => Int, { nullable: true })
  TotalWLFBatches?: number;

  @Field((type) => Int, { nullable: true })
  TotalUSR?: number;

  @Field({ nullable: true })
  stripeCustomerId?: string;

  @Field({ nullable: true })
  subscriptionId?: string;

  @Field({ nullable: true })
  apiKey?: string;

  @Field({ nullable: true })
  endpointId?: string;

  @Field({ nullable: true })
  usagePlanId?: string;

  @Field({ nullable: true })
  safeDelete?: boolean;

  @Field({ nullable: true })
  requestRemovalDate?: string;
}
