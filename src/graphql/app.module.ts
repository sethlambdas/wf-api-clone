import { Logger, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLError } from 'graphql';
import { ConfigUtil } from '../utils/config.util';
import * as typeOrmConfig from './../config/typeorm.config';
import { FileModule } from './files/file.module';
import { TaskModule } from './tasks/task.module';
import { UserModule } from './users/user.module';

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
  ],
})
export class AppModule {}
