import { Module } from '@nestjs/common';
import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { OrganizationRepository } from './organization.repository';
import { OrganizationResolver } from './organization.resolver';
import { OrganizationService } from './organization.service';

@Module({
  imports: [DynamoDBModule],
  providers: [OrganizationResolver, OrganizationService, OrganizationRepository],
})
export class OrganizationModule {}
