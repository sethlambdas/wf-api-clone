import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
const { MongoClient } = require('mongodb');
const mssql = require('mssql');
const mysql = require('mysql2');
const postgres = require('postgres');
const oracle = require('oracledb');

interface ColumnOuputInterface {
  result: any[];
  error?: string;
}

@Injectable()
export class DBEngineService {
  constructor() {}
  logger = new Logger('DB Engine Service');
  mysqlGetTableColumns = async ({ params, payload }): Promise<ColumnOuputInterface> => {
    const { tableName } = params;
    try {
      this.logger.log('MYSQL Connection');
      const connection = mysql.createConnection(payload);

      connection.connect();
      this.logger.log('Connected successfully to Mysql server');
      let res;
      await new Promise<void>((resolve, reject) => {
        connection.query(`DESCRIBE ${tableName}`, (err, results, fields) => {
          if (err) {
            reject(err);
          }
          res = results;
          resolve();
        });
      });
      this.logger.log('result', res);
      connection.end();
      return { result: res };
    } catch (error) {
      this.logger.log('error', error);
      return { error: error.message, result: [] };
    }
  };

  mysqlTestConnection = async ({ payload }): Promise<boolean> => {
    try {
      this.logger.log('MYSQL Connection');
      const connection = mysql.createConnection(payload);

      connection.connect();
      this.logger.log('Connected successfully to Mysql server');
      let res;
      await new Promise<void>((resolve, reject) => {
        connection.query(`select now()`, (err, results, fields) => {
          if (err) {
            reject(err);
          }
          res = results;
          resolve();
        });
      });
      this.logger.log('result', res);
      connection.end();
      return res ? true : false;
    } catch (error) {
      this.logger.log('error', error);
      return false;
    }
  };

  mongoGetTableColumns = async ({ params, payload }): Promise<ColumnOuputInterface> => {
    const { tableName } = params;
    try {
      this.logger.log('Mongo Connection');
      const { host, port, database, username, password } = payload;
      const url = `mongodb://${host}:${port}`;
      const client = new MongoClient(url, { auth: { username, password } });
      await client.connect();
      this.logger.log('Connected successfully to Mongo server');
      const db = client.db(database);
      const collection = await db
        .collection(tableName)
        .findOne()
        .finally(() => client.close());
      this.logger.log(Object.keys(collection));
      const result = Object.keys(collection);

      return { result };
    } catch (error) {
      this.logger.log('error', error);
      return { error: error.message, result: [] };
    }
  };

  mongoTestConnection = async ({ payload }): Promise<boolean> => {
    try {
      this.logger.log('Mongo Connection');
      const { host, port, database, username, password } = payload;
      const url = `mongodb://${host}:${port}`;
      const client = new MongoClient(url, { auth: { username, password } });
      await client.connect();
      this.logger.log('Connected successfully to Mongo server');
      const db = client.db(database);
      const collection = await db.listCollections();
      return true;
    } catch (error) {
      this.logger.log('error', error);
      return false;
    }
  };

  dynamoGetTableColumns = async ({ params, payload }): Promise<ColumnOuputInterface> => {
    const { tableName } = params;
    try {
      this.logger.log('Dynamo Connection');
      // Connection URL
      const dynamoClient = new AWS.DynamoDB(payload);
      const result = [];
      await new Promise<void>((resolve, reject) => {
        dynamoClient.describeTable({ TableName: tableName }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            data.Table.AttributeDefinitions.map(({ AttributeName }) => {
              result.push(AttributeName);
            });
            resolve();
          }
        });
      });

      return { result };
    } catch (error) {
      this.logger.log('error', error);
      return { error: error.message, result: [] };
    }
  };

  dynamoTestConnection = async ({ params, payload }): Promise<boolean> => {
    const { tableName } = params;
    try {
      this.logger.log('Dynamo Connection');
      // Connection URL
      const dynamoClient = new AWS.DynamoDB(payload);
      const result = [];
      await new Promise<void>((resolve, reject) => {
        dynamoClient.describeTable({ TableName: tableName }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            data.Table.AttributeDefinitions.map(({ AttributeName }) => {
              result.push(AttributeName);
            });
            resolve();
          }
        });
      });

      return result ? true : false;
    } catch (error) {
      this.logger.log('error', error);
      return false;
    }
  };

  postgresGetTableColumns = async ({ params, payload }): Promise<ColumnOuputInterface> => {
    const { tableName } = params;
    let errs = 'something';
    try {
      this.logger.log('Postgres Connection');
      const sql = postgres(payload);

      this.logger.log('Connected successfully to Postgres server');
      const result = [];
      const tableFields =
        await sql`select column_name from INFORMATION_SCHEMA.COLUMNS where table_name = ${tableName};`;
      this.logger.log('result', JSON.stringify(tableFields));
      tableFields.map(({ column_name }) => {
        result.push(column_name);
      });
      return { result };
    } catch (error) {
      this.logger.log('error', error);
      return { error: error.message, result: [] };
    }
  };

  postgresTestConnection = async ({ payload }): Promise<boolean> => {
    try {
      this.logger.log('Postgres test Connection', payload);
      const sql = postgres(payload);

      this.logger.log('Connected successfully to Postgres server');
      const tableFields = await sql`select now()`;
      this.logger.log('result', JSON.stringify(tableFields));
      return tableFields ? true : false;
    } catch (error) {
      this.logger.log('error', error);
      return false;
    }
  };

  microsoftSqlGetTableColumns = async ({ params, payload }): Promise<ColumnOuputInterface> => {
    const { tableName } = params;
    try {
      this.logger.log('MSSQL Connection');
      const { encrypt, trustServerCertificate } = payload;
      const sqlConfig = {
        ...payload,
        encrypt: JSON.parse(encrypt),
        trustServerCertificate: JSON.parse(trustServerCertificate),
      };
      const pool = new mssql.ConnectionPool(sqlConfig);
      this.logger.log('Connected successfully to Microsoft SQL server');
      await pool.connect();
      const tableFields = [];
      const result = await pool.query(`exec sp_columns ${tableName}`).finally(() => pool.close());
      this.logger.log('result', result);
      result.recordset.map(({ COLUMN_NAME }) => {
        tableFields.push(COLUMN_NAME);
      });
      return { result: tableFields };
    } catch (error) {
      this.logger.log('error', error);
      return { error: error.message, result: [] };
    }
  };

  microsoftSqlTestConnection = async ({ payload }): Promise<boolean> => {
    try {
      this.logger.log('MSSQL Connection');
      const { encrypt, trustServerCertificate } = payload;
      const sqlConfig = {
        ...payload,
        encrypt: JSON.parse(encrypt),
        trustServerCertificate: JSON.parse(trustServerCertificate),
      };
      const pool = new mssql.ConnectionPool(sqlConfig);
      this.logger.log('Connected successfully to Microsoft SQL server');
      await pool.connect();
      const result = await pool.query(`SELECT [name] FROM sys.databases`).finally(() => pool.close());
      return result ? true : false;
    } catch (error) {
      this.logger.log('error', error);
      return false;
    }
  };

  oracleDBGetTableColumns = async ({ params, payload }): Promise<ColumnOuputInterface> => {
    const { tableName } = params;
    try {
      this.logger.log('Oracle Connection . . .');
      // works for windows / mac os
      if (payload.libDir) {
        oracle.initOracleClient({ libDir: payload.libDir });
      }
      const connection = await oracle.getConnection(payload);
      const result = await connection.execute(`select * from user_tab_columns where table_name='${tableName}'`);
      connection.commit();
      connection.close();
      const tableFields = [];
      result.rows.forEach((row: any[]) => {
        tableFields.push(row[1]);
      });
      return { result: tableFields };
    } catch (error) {
      this.logger.log('error', error);
      return { error: error.message, result: [] };
    }
  };

  oracleDBTestConnection = async ({ payload }): Promise<boolean> => {
    try {
      console.log('Oracle Connection . . .', payload);
      // works for windows / mac os
      if (payload.libDir) {
        oracle.initOracleClient({ libDir: payload.libDir });
      }
      const connection = await oracle.getConnection(payload);
      const result = await connection.execute(`select SYSDATE FROM dual`);
      connection.commit();
      connection.close();
      return result ? true : false;
    } catch (error) {
      this.logger.log('error', error);
      return false;
    }
  };
}
