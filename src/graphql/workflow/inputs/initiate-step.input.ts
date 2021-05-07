import { Field, InputType } from '@nestjs/graphql';
import { WorkflowKeysInput } from '../../common/inputs/workflow-key.input';

@InputType()
export class InitiateCurrentStepInput {
  @Field()
  Key: WorkflowKeysInput;

  @Field()
  ActivityType: string;

  @Field({ nullable: true })
  Approve?: boolean;
}
