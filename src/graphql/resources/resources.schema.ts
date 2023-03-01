import { Schema } from 'dynamoose';
import { QueryBuilderEnum } from '../common/enums/db-query-builder.enum';

const ConfigSchema = new Schema({
  fieldName: {
    type: String,
    required: true,
  },
  fieldValue: {
    type: String,
    required: true,
  },
});

export const ResourcesSchema = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    name: {
      type: String,
    },
    database: {
      type: String,
      enum: [
        QueryBuilderEnum.DYNAMODB,
        QueryBuilderEnum.MICROSOFTSQL,
        QueryBuilderEnum.MONGODB,
        QueryBuilderEnum.MYSQL,
        QueryBuilderEnum.POSTGRESQL,
        QueryBuilderEnum.MARIADB,
        QueryBuilderEnum.ORACLEDB,
      ],
    },
    configuration: {
      type: Array,
      schema: [ConfigSchema],
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
