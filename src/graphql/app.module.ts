import { Logger, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TerminusModule } from '@nestjs/terminus';
import { GraphQLError } from 'graphql';
import { DynamooseModule } from 'nestjs-dynamoose';

import { ConfigUtil } from '@lambdascrew/utility';

import { ClientModule } from './client/client.module';
import { AppHealthIndicator } from './health/app.health';
import { HealthController } from './health/health.controller';
import { OrganizationModule } from './organizations/organization.module';
import { WorkflowExecutionModule } from './workflow-executions/workflow-execution.module';
import { WorkflowStepExecutionHistoryModule } from './workflow-steps-executions-history/worflow-steps-wxh.module';
import { WorkflowStepModule } from './workflow-steps/workflow-step.module';
import { WorkflowVersionModule } from './workflow-versions/workflow-version.module';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  controllers: [HealthController],
  providers: [AppHealthIndicator],
  imports: [
    GraphQLModule.forRoot({
      useGlobalPrefix: true,
      autoSchemaFile: `${__dirname}/schema.gql`,
      sortSchema: true,
      cors: {
        credentials: true,
        origin: ConfigUtil.get('server.origin'),
      },
      context: ({ req, res }) => {
        Logger.debug('===============================');
        Logger.debug('GRAPHQL QUERY: ');
        Logger.debug(req.body.query);
        Logger.debug('VARIABLES: ');
        Logger.debug(req.body.variables);
        Logger.debug('===============================');
        return { req, res };
      },
      formatError: (error: GraphQLError) => {
        Logger.debug('===============================');
        Logger.debug('GRAPHQL ERROR: ');
        Logger.debug(error);
        Logger.debug('===============================');
        return error;
      },
    }),
    DynamooseModule.forRoot({
      local: ConfigUtil.get('dynamodb.local') ? ConfigUtil.get('dynamodb.local') : false,
      aws: {
        region: ConfigUtil.get('aws.region'),
      },
      model: {
        create: ConfigUtil.get('dynamodb.local') ? true : false,
      },
    }),
    TerminusModule,
    WorkflowModule,
    WorkflowExecutionModule,
    WorkflowVersionModule,
    WorkflowStepModule,
    OrganizationModule,
    WorkflowStepExecutionHistoryModule,
    ClientModule,
  ],
})
export class AppModule {}
