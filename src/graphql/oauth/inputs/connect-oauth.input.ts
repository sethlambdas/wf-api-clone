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


@InputType()
export class RefreshOAuthInput {
  @Field()
  clientPK: string;

  @Field()
  clientSK: string;
}