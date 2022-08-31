import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class FindClientTokenByPkInput {
  @Field()
  PK: string;
}
