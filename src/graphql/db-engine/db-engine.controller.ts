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

  @Post('/test/mysql-connection')
  async mysqlTestConnection(@Body() payload: any) {
    const result = await this.dbEngineService.mysqlTestConnection({ payload });
    return result;
  }

  @Post('/describe/mongo-table-columns/:tableName')
  async describeMongoTableColumns(@Param() param: any, @Body() payload: any) {
    const { result, error } = await this.dbEngineService.mongoGetTableColumns({ params: param, payload });
    return { result, error };
  }

  @Post('/test/mongo-connection')
  async mongoTestConnection(@Body() payload: any) {
    const result = await this.dbEngineService.mongoTestConnection({ payload });
    return result;
  }

  @Post('/describe/dynamo-table-columns/:tableName')
  async describeDynamoTableColumns(@Param() param: any, @Body() payload: any) {
    const { result, error } = await this.dbEngineService.dynamoGetTableColumns({ params: param, payload });
    return { result, error };
  }

  @Post('/test/dynamo-connection/:tableName')
  async dynamoTestConnection(@Param() params: any, @Body() payload: any) {
    const result = await this.dbEngineService.dynamoTestConnection({ params, payload });
    return result;
  }

  @Post('/describe/postgres-table-columns/:tableName')
  async describePostgresTableColumns(@Param() param: any, @Body() payload: any) {
    const { result, error } = await this.dbEngineService.postgresGetTableColumns({ params: param, payload });
    return { result, error };
  }

  @Post('/test/postgres-connection')
  async postgresTestConnection(@Body() payload: any) {
    const result = await this.dbEngineService.postgresTestConnection({ payload });
    return result;
  }

  @Post('/describe/microsoftsql-table-columns/:tableName')
  async describeMicrosoftSqlTableColumns(@Param() param: any, @Body() payload: any) {
    const { result, error } = await this.dbEngineService.microsoftSqlGetTableColumns({ params: param, payload });
    return { result, error };
  }

  @Post('/test/mssql-connection')
  async mssqlTestConnection(@Body() payload: any) {
    const result = await this.dbEngineService.microsoftSqlTestConnection({ payload });
    return result;
  }

  @Post('/describe/oracle-table-columns/:tableName')
  async describeOracleDBTableColumns(@Param() param: any, @Body() payload: any) {
    const { result, error } = await this.dbEngineService.oracleDBGetTableColumns({ params: param, payload });
    return { result, error };
  }

  @Post('/test/oracle-connection')
  async OracleDBTestConnection(@Body() payload: any) {
    const result = await this.dbEngineService.oracleDBTestConnection({ payload });
    return result;
  }
}
