import { Field, InputType } from '@nestjs/graphql';
import { ACTInput } from '../../common/entities/workflow-step.entity';

@InputType()
export class CreateWorkflowStepInput {
  @Field()
  WorkflowVersionSK: string;

  @Field((type) => [String])
  NAID: string[];

  @Field()
  AID: string;

  @Field((type) => ACTInput, { nullable: true })
  ACT?: ACTInput;

  @Field({ nullable: true })
  DATA?: string;
}
