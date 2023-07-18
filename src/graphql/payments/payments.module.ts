import { Module } from '@nestjs/common';
import { OrganizationModule } from '../../graphql/organizations/organization.module';
import { UserModule } from '../../graphql/users/user.module';
import { PaymentsController } from './payments.controller';
import { PaymentService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentService],
  imports: [UserModule, OrganizationModule],
  exports: [PaymentService],
})
export class PaymentsModule {}
