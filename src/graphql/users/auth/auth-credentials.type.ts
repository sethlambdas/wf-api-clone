import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthCredentials {
  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  refreshTokenGenerate?: string;
}
