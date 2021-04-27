import { Field, ObjectType } from '@nestjs/graphql';
import { CAT } from '../workflow-executions/workflow-execution.entity';
import { DesignWorkflow } from '../workflow-steps/workflow-step.entity';

@ObjectType()
export class WorkflowDetails {
  @Field({ nullable: true })
  WID?: string;

  @Field({ nullable: true })
  WVID?: string;

  @Field((type) => [CAT], { nullable: true })
  ACTIVITIES?: CAT[];

  @Field((type) => [DesignWorkflow], { nullable: true })
  DESIGN?: DesignWorkflow[];
}
