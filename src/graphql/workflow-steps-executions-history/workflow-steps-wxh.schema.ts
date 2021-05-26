import { Schema } from 'dynamoose';
import { MDSchema } from '../dynamodb/schemas/act.schema';

export const WorkflowStepExecutionHistorySchema = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    SK: {
      type: String,
      rangeKey: true,
    },
    T: {
      type: String,
    },
    NM: {
      type: String,
    },
    WLFN: {
      type: String,
    },
    MD: {
      type: Object,
      schema: MDSchema,
    },
    END: {
      type: Boolean,
    },
    WSID: {
      type: String,
    },
    Status: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
