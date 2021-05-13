import { Field, Int, ObjectType } from '@nestjs/graphql';
import { SimplePrimaryKey } from '../common/interfaces/workflow-key.interface';

@ObjectType()
export class Organization implements SimplePrimaryKey {
  @Field()
  PK: string;

  @Field()
  ORGNAME: string;

  @Field((type) => Int)
  TotalWLF: number;

  @Field((type) => Int)
  TotalUSR: number;
}
