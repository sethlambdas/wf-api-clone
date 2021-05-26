import { Field, InputType, OmitType } from '@nestjs/graphql';
import { ACTInput } from '../../common/entities/workflow-step.entity';

@InputType()
export class CreateWorkflowStepExecutionHistoryInput extends OmitType(ACTInput, ['DESIGN', 'END'] as const) {
  @Field()
  OrgId: string;

  @Field()
  PK: string;

  @Field({ nullable: true })
  SK?: string;

  @Field()
  WorkflowStepSK: string;

  @Field()
  WLFN: string;

  @Field()
  Status: string;

  @Field((type) => Boolean, { defaultValue: false })
  END?: boolean;
}
