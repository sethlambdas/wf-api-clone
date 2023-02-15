import { Logger, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TerminusModule } from '@nestjs/terminus';
import { GraphQLError } from 'graphql';
import { DynamooseModule } from 'nestjs-dynamoose';

import { ConfigUtil } from '@lambdascrew/utility';

import { ApigwAuthorizerModule as ApigwAuthorizerAuthBEModule } from './apigw-authorizer/apigw-authorizer.module';
import { ApigwAuthorizerModule } from './apigwAuthorizer/apigw-authorizer.module';
import { ClientTokenModule } from './client-token/client-token.module';
import { ClientModule } from './client/client.module';
import { DBEngineModule } from './db-engine/db-engine.module';
import { DocuwareModule } from './docuware/docuware.module';
import { EntityCountModule } from './entity-count/entitiy-count.module';
import { HealthResolver } from './health copy/health.resolver';
import { AppHealthIndicator } from './health/app.health';
import { HealthController } from './health/health.controller';
import { IntegrationAppModule } from './integration-app/integration-app.module';
import { OAuthModule } from './oauth/oauth.module';
import { OrganizationModule } from './organizations/organization.module';
import { UserModule } from './users/user.module';
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
        create: true,
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
    IntegrationAppModule,
    UserModule,
    ApigwAuthorizerModule,
    ApigwAuthorizerAuthBEModule,
    HealthResolver,
    ClientTokenModule,
    OAuthModule,
    EntityCountModule,
    DocuwareModule,
    DBEngineModule,
  ],
})
export class AppModule {}
