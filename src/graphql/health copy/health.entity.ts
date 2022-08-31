import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class HealthCheck {
  @Field()
  app: string;

  @Field()
  status: string;

  @Field()
  state: string;
}
