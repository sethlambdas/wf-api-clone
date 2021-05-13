/* tslint:disable:max-classes-per-file */
import { Field, ObjectType } from '@nestjs/graphql';
import { ACT } from '../common/entities/workflow-step.entity';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';

@ObjectType()
export class WorkflowStep implements CompositePrimaryKey {
  @Field()
  PK: string;

  @Field()
  SK: string;

  @Field((type) => [String])
  NAID: string[];

  @Field()
  AID: string;

  @Field((type) => ACT)
  ACT: ACT;

  @Field()
  DATA: string;
}
