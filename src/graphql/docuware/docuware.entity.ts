import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DocuwareClient {
  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  password?: string;

  @Field({ nullable: true })
  organisation?: string;

  @Field({ nullable: true })
  hostId?: string;

  @Field({ nullable: true })
  rootUrl?: string;

  @Field({ nullable: true })
  cookie?: string;
}
