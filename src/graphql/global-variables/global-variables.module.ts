import { Module } from '@nestjs/common';
import { GlobalVariablesService } from './global-variables.service';
import { GlobalVariablesResolver } from './global-variables.resolver';
import { DynamoDBModule } from '../../graphql/dynamodb/dynamodb.module';
import { GlobalVariable } from './entities/global-variable.entity';

@Module({
  imports: [DynamoDBModule],
  providers: [GlobalVariablesResolver, GlobalVariablesService],
})
export class GlobalVariablesModule {}
