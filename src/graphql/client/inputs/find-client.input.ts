import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class FindClientByPkInput {
  @Field()
  PK: string;

  @Field()
  SK: string;
}

@InputType()
export class FindClientByNameInput {
  @Field()
  appClient: string;

  @Field()
  orgId: string;

  @Field()
  integrationName: string;

  @Field()
  clientName: string;
}

@InputType()
export class ListClientsInput {
  @Field()
  appClient: string;

  @Field()
  orgId: string;

  @Field({ nullable: true })
  integrationName?: string;
}
