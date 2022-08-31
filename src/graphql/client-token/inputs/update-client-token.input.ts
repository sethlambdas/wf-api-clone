import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateClientTokenInput } from './create-client-token.inputs';

@InputType()
export class ClientTokenInput extends PartialType(CreateClientTokenInput) {}

@InputType()
export class UpdateClientTokenInput {
  @Field()
  PK: string;

  @Field((type) => ClientTokenInput)
  clientToken: ClientTokenInput;
}
