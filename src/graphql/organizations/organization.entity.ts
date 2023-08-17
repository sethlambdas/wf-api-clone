import { SimplePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Organization implements SimplePrimaryKey {
  @Field()
  PK: string;

  @Field()
  ORGNAME: string;

  @Field((type) => Int)
  TotalWLFBatches: number;

  @Field((type) => Int)
  TotalUSR: number;
  
  @Field()
  stripeCustomerId?: string;

  @Field()
  subscriptionId?: string;

  @Field()
  apiKey?: string;

  @Field()
  endpointId?: string;

  @Field()
  usagePlanId?: string;
}
