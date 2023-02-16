import { DynamoDBClient, ExecuteStatementCommand, ExecuteStatementCommandInput } from '@aws-sdk/client-dynamodb';
import { Logger } from '@nestjs/common';
import { getMentionedData } from 'utils/helpers/string-helpers.util';
import { IFieldValue } from 'utils/workflow-types/lambda.types';
import { QueryBuilderEnum } from '../../graphql/common/enums/db-query-builder.enum';
const mssql = require('mssql');
const pg = require('pg');
const mysql = require('mysql2');
const { MongoClient } = require('mongodb');

const logger = new Logger('dbQueryBuilder');

interface DBConfigsProps {
  configs: {
    DB: string;
    dbQuery: string | DBQueryObject;
    dbConfigs: IFieldValue[];
    TableName: string;
  };
}

interface DBQueryObject {
  jsonTree: object;
  queryResult: string;
}

interface MongoConfigParams {
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
}

interface ResultOutputModifier {
  query: string;
  result: any;
  database_type: string;
}

interface DynamoConfigParams {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
}

export default async function dbQueryBuilder(payload: any, state?: any) {
  logger.log('Query Builder Activity');
  const { DB, DBQuery, DBConfigs, TableName } = payload;
  const parsedPayload = {
    DB,
    dbQuery: parseQuery(DBQuery, state),
    dbConfigs: JSON.parse(DBConfigs),
    TableName,
  };
  let result: any;
  try {
    switch (DB) {
      case QueryBuilderEnum.MYSQL:
        result = await mysqlQuery({ configs: parsedPayload });
        break;
      case QueryBuilderEnum.MONGODB:
        result = await mongoQuery({ configs: parsedPayload });
        break;
      case QueryBuilderEnum.DYNAMODB:
        result = await dynamoQuery({ configs: parsedPayload });
        break;
      case QueryBuilderEnum.POSTGRESQL:
        result = await postgresQuery({ configs: parsedPayload });
        break;
      case QueryBuilderEnum.MICROSOFTSQL:
        result = await mssqlQuery({ configs: parsedPayload });
        break;
      default:
        result = await mysqlQuery({ configs: parsedPayload });
        break;
    }

    return { dbResult: result };
  } catch (err) {
    logger.log('error', err);
    return { dbResult: result };
  }
}

const mysqlQuery = async ({ configs }: DBConfigsProps): Promise<any> => {
  logger.log('MYSQL Query . . .');
  logger.log('dbConfigs: ', configs);
  let mysqlConfig = {};
  configs.dbConfigs.forEach((el) => {
    const { fieldName, fieldValue } = el;
    mysqlConfig = {
      ...mysqlConfig,
      [fieldName]: !isNaN(parseInt(fieldValue)) ? parseInt(fieldValue) : fieldValue,
    };
  });

  const connection = mysql.createConnection(mysqlConfig);

  connection.connect();

  let query = '';

  try {
    if (typeof configs.dbQuery === 'string') {
      query = configs.dbQuery;
    } else {
      query = `SELECT * FROM ${configs.TableName} WHERE ${configs.dbQuery.queryResult.replace(/\"/g, '')}`;
    }

    let res: any;
    logger.log('query:', query);

    await new Promise<void>((resolve, reject) => {
      connection.query(query, (err, results) => {
        if (err) {
          reject(err);
        }
        res = results;
        resolve();
      });
    });
    connection.end();
    const result = resultOutputModifier({ database_type: configs.DB, query: query, result: res });
    return result;
  } catch (error) {
    return { error: error };
  }
};

const mongoQuery = async ({ configs }: DBConfigsProps): Promise<any> => {
  logger.log('Mongo Query . . .');
  logger.log('dbConfigs: ', configs);
  let mongoConfig: MongoConfigParams;
  configs.dbConfigs.forEach((el) => {
    const { fieldName, fieldValue } = el;
    mongoConfig = {
      ...mongoConfig,
      [fieldName]: !isNaN(parseInt(fieldValue)) ? parseInt(fieldValue) : fieldValue,
    };
  });

  let res: any;
  const collection = configs.TableName || '';
  try {
    const { host, port, database, username, password } = mongoConfig;
    const url = `mongodb://${host}:${port}`;
    const client = new MongoClient(url, { auth: { username, password } });
    await client.connect();
    logger.log('Connected successfully to Mongo server, doing query . . .');
    const db = client.db(database);
    let query = {};
    let result: any;
    if (typeof configs.dbQuery === 'object' && configs.dbQuery.queryResult) {
      // Visual DB Query
      query = JSON.parse(configs.dbQuery.queryResult);
      result = await db.collection(collection).find(query).toArray();
    } else {
      // SQL | Doc Query
      query = configs.dbQuery;
      result = await db.command(query).finally(() => client.close());
    }
    const finalResult = resultOutputModifier({
      database_type: configs.DB,
      query: JSON.stringify(query),
      result: result,
    });
    return finalResult;
  } catch (err) {
    logger.log('Mongo Error', err.message);
    return { error: err.message };
  }
};

const dynamoQuery = async ({ configs }: DBConfigsProps): Promise<any> => {
  logger.log('Dynamo Query . . .');
  logger.log('dbConfigs: ', configs);
  let dynamoConfig: DynamoConfigParams;
  configs.dbConfigs.forEach((el) => {
    const { fieldName, fieldValue } = el;
    dynamoConfig = {
      ...dynamoConfig,
      [fieldName]: !isNaN(parseInt(fieldValue)) ? parseInt(fieldValue) : fieldValue,
    };
  });

  try {
    const { region, accessKeyId, secretAccessKey, endpoint } = dynamoConfig;
    const docClient = new DynamoDBClient({ credentials: { accessKeyId, secretAccessKey }, endpoint, region });
    const tableName = configs.TableName;
    let params: ExecuteStatementCommandInput;
    if (typeof configs.dbQuery === 'string') {
      params = { Statement: configs.dbQuery };
    } else {
      params = {
        Statement: `SELECT * FROM ${tableName} WHERE ${configs.dbQuery.queryResult.replace(/\"/g, '')}`,
      };
    }
    const data = await docClient.send(new ExecuteStatementCommand(params));

    const result = resultOutputModifier({ database_type: configs.DB, query: JSON.stringify(params), result: data });
    return result;
  } catch (err) {
    return { error: err };
  }
};

const postgresQuery = async ({ configs }: DBConfigsProps): Promise<any> => {
  logger.log('Postgres Query . . .');
  logger.log('dbConfigs: ', configs);
  let postgresConfig = {};
  configs.dbConfigs.forEach((el) => {
    const { fieldName, fieldValue } = el;
    postgresConfig = {
      ...postgresConfig,
      [fieldName]: !isNaN(parseInt(fieldValue)) ? parseInt(fieldValue) : fieldValue,
    };
  });
  const pool = new pg.Pool(postgresConfig);

  let query = { text: '' };

  try {
    if (typeof configs.dbQuery === 'string') {
      query = { text: configs.dbQuery };
    } else {
      query = { text: `SELECT * FROM ${configs.TableName} WHERE ${configs.dbQuery.queryResult.replace(/\"/g, '')}` };
    }

    const queryResult = await pool.query(query);
    const result = resultOutputModifier({
      database_type: configs.DB,
      query: JSON.stringify(query),
      result: queryResult,
    });
    pool.end();
    return result;
  } catch (error) {
    pool.end();
    return { error: error };
  }
};

const mssqlQuery = async ({ configs }: DBConfigsProps): Promise<any> => {
  logger.log('MSSQL Query . . .');
  logger.log('dbConfigs: ', configs);
  let msSql = {};
  configs.dbConfigs.forEach((el) => {
    const { fieldName, fieldValue } = el;
    let value;
    try {
      value = JSON.parse(fieldValue);
    } catch (err) {
      value = !isNaN(parseInt(fieldValue)) ? parseInt(fieldValue) : fieldValue;
    }
    msSql = {
      ...msSql,
      [fieldName]: value,
    };
  });

  const mspool = new mssql.ConnectionPool(msSql);
  await mspool.connect();

  let query = '';

  try {
    if (typeof configs.dbQuery === 'string') {
      query = configs.dbQuery;
    } else {
      query = `SELECT * FROM ${configs.TableName} WHERE ${configs.dbQuery.queryResult.replace(/\"/g, '')}`;
    }
    const queryResult = await mspool.query(query).finally(() => mspool.close());
    const result = resultOutputModifier({ database_type: configs.DB, query: query, result: queryResult });
    return result;
  } catch (error) {
    return { error: error };
  }
};

const parseQuery = (dbQuery: any, state: any): string | DBQueryObject => {
  let parsedQuery;
  try {
    parsedQuery = JSON.parse(dbQuery);
  } catch (err) {
    parsedQuery = getMentionedData(dbQuery, state);
  }
  return parsedQuery;
};

const resultOutputModifier = ({ query, result, database_type }: ResultOutputModifier) => {
  let output = {
    affected_rows: 0,
  };
  if (query.toLowerCase().includes('update') || query.toLowerCase().includes('delete')) {
    switch (database_type) {
      case QueryBuilderEnum.MYSQL:
        output = {
          affected_rows: result.affectedRows,
        };
        break;
      case QueryBuilderEnum.MONGODB:
        output = {
          affected_rows: result.n,
        };
        break;
      case QueryBuilderEnum.POSTGRESQL:
        output = {
          affected_rows: result.rowCount,
        };
        break;
      case QueryBuilderEnum.MICROSOFTSQL:
        output = {
          affected_rows: result.rowsAffected[0],
        };
        break;
      case QueryBuilderEnum.DYNAMODB:
        output = {
          affected_rows: result.Items.length,
        };
        break;

      default:
        output = result;
        break;
    }
  } else {
    output = result;
  }
  return output;
};
