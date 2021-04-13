import { Logger, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLError } from 'graphql';
import { DynamooseModule } from 'nestjs-dynamoose';
import { ConfigUtil } from '../utils/config.util';
import * as typeOrmConfig from './../config/typeorm.config';
import { FileModule } from './files/file.module';
import { TaskModule } from './tasks/task.module';
import { UserModule } from './users/user.module';
import { WorkflowExecutionModule } from './workflow-executions/workflow-execution.module';
import { WorkflowSpecModule } from './workflow-specs/workflow-spec.module';
import { WorkflowVersionModule } from './workflow-versions/workflow-version.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
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
    FileModule,
    TaskModule,
    UserModule,
    DynamooseModule.forRoot({
      local: ConfigUtil.get('dynamodb.local'),
      aws: {
        accessKeyId: ConfigUtil.get('aws.accessKeyId'),
        secretAccessKey: ConfigUtil.get('aws.secretAccessKey'),
        region: ConfigUtil.get('aws.region'),
      },
    }),
    WorkflowExecutionModule,
    WorkflowVersionModule,
    WorkflowSpecModule,
  ],
})
export class AppModule {}
