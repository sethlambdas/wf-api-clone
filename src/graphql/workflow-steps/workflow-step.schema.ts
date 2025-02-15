import { Schema } from 'dynamoose';
import { ACTSchema } from '../dynamodb/schemas/act.schema';

export const WorkflowStepSchema = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    SK: {
      type: String,
      rangeKey: true,
    },
    NAID: {
      type: Array,
      schema: [String],
    },
    AID: {
      type: String,
    },
    ACT: {
      type: Object,
      schema: ACTSchema,
    },
    DATA: {
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
