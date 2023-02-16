import { Body, Controller, Get, Logger, Param, Post, Req } from '@nestjs/common';
import { DBEngineService } from './db-engine.service';
const mysql = require('mysql2');

@Controller('database')
export class DBEngineController {
  constructor(private dbEngineService: DBEngineService) {}
  logger = new Logger('DBEngine Controller');

  @Post('/describe/mysql-table-columns/:tableName')
  async describeMySQLTableColumns(@Param() param: any, @Body() payload: any) {
    const { result, error } = await this.dbEngineService.mysqlGetTableColumns({ params: param, payload });
    return { result, error };
  }

  @Post('/describe/mongo-table-columns/:tableName')
  async describeMongoTableColumns(@Param() param: any, @Body() payload: any) {
    const { result, error } = await this.dbEngineService.mongoGetTableColumns({ params: param, payload });
    return { result, error };
  }

  @Post('/describe/dynamo-table-columns/:tableName')
  async describeDynamoTableColumns(@Param() param: any, @Body() payload: any) {
    const { result, error } = await this.dbEngineService.dynamoGetTableColumns({ params: param, payload });
    return { result, error };
  }

  @Post('/describe/postgres-table-columns/:tableName')
  async describePostgresTableColumns(@Param() param: any, @Body() payload: any) {
    const { result, error } = await this.dbEngineService.postgresGetTableColumns({ params: param, payload });
    return { result, error };
  }

  @Post('/describe/microsoftsql-table-columns/:tableName')
  async describeMicrosoftSqlTableColumns(@Param() param: any, @Body() payload: any) {
    const { result, error } = await this.dbEngineService.microsoftSqlGetTableColumns({ params: param, payload });
    return { result, error };
  }
}
