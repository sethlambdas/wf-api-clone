import { Field, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { ACTInput } from '../../common/entities/workflow-step.entity';
import { WebService } from '../workflow-steps-wxh.entity';

@InputType()
export class WebServiceInput extends PartialType(WebService, InputType) {}

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

  @Field()
  UQ_OVL: string;

  @Field((type) => Boolean, { defaultValue: false })
  END?: boolean;

  @Field((type) => WebServiceInput, { nullable: true })
  WEB_SERVICE?: WebServiceInput;

  @Field((type) => String, { nullable: true })
  MATCH_RESULT?: string;

  @Field((type) => String, { nullable: true })
  DB_QUERY_RESULT?: string;
}
