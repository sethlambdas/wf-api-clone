import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CredentialsSchema } from '../apigw-authorizer.entity';

@InputType()
export class CredentialsInput extends PartialType(CredentialsSchema, InputType) {}

@InputType()
export class CreateApigwAuthorizerInput {
  @Field()
  triggerId: string;

  @Field()
  type: string;

  @Field()
  httpMethod: string;

  @Field((type) => CredentialsInput, { nullable: true })
  credentials?: CredentialsInput;
}
