import { Field, InputType, Int } from '@nestjs/graphql';
import { DesignWorkflowInput } from '../../common/entities/workflow-step.entity';
import { StateWorkflowInput } from './state-workflow.input';

@InputType()
export class CreateWorkflowInputRepository {
  @Field()
  OrgId: string;

  @Field()
  WorkflowName: string;

  @Field({ nullable: true })
  Repeat: string;

  @Field((type) => Int)
  WorkflowNumber: number;
}

@InputType()
export class CreateWorkflowInput {
  @Field()
  OrgId: string;

  @Field()
  WorkflowName: string;

  @Field({ nullable: true })
  Repeat: string;

  @Field({ nullable: true })
  WorkflowId?: string;

  @Field((type) => [DesignWorkflowInput], { nullable: true })
  Design?: DesignWorkflowInput[];

  @Field()
  StartAt: string;

  @Field((type) => [StateWorkflowInput])
  States: StateWorkflowInput[];
}
