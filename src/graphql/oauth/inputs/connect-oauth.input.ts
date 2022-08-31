import { Field, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class ConnectOAuthInput {
  @Field()
  clientPK: string;

  @Field()
  clientSK: string;

  @Field()
  fromUrl: string;
}
