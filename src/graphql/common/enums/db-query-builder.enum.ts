import { registerEnumType } from '@nestjs/graphql';

export enum QueryBuilderEnum {
  MYSQL = 'MYSQL',
  MONGODB = 'MONGODB',
  DYNAMODB = 'DYNAMODB',
  POSTGRESQL = 'POSTGRESQL',
  MICROSOFTSQL = 'MICROSOFTSQL',
  MARIADB = 'MARIADB',
  ORACLEDB = 'ORACLEDB',
}

registerEnumType(QueryBuilderEnum, {
  name: 'QueryBuilderEnum',
  description: 'Database type',
  valuesMap: {
    MYSQL: {
      description: 'mysql database',
    },
    MONGODB: {
      description: 'mongodb database',
    },
    DYNAMODB: {
      description: 'dynamodb database',
    },
    POSTGRESQL: {
      description: 'postgres database',
    },
    MICROSOFTSQL: {
      description: 'micrsosft database',
    },
    MARIADB: {
      description: 'maria database',
    },
    ORACLEDB: {
      description: 'oracle database',
    },
  },
});
