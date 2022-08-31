import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class FindApigwAuthorizerByPkInput {
  @Field()
  PK: string;
}
