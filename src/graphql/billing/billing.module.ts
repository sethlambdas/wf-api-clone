import { forwardRef, Module } from '@nestjs/common';
import { WorkflowExecutionModule } from '../workflow-executions/workflow-execution.module';
import { OrganizationModule } from '../organizations/organization.module';
import { UserModule } from '../users/user.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  controllers: [BillingController],
  providers: [BillingService],
  imports: [UserModule, OrganizationModule, WorkflowExecutionModule, forwardRef(() => WorkflowModule)],
  exports: [BillingService],
})
export class BillingModule {}
