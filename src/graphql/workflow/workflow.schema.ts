import { Schema } from 'dynamoose';

export const WorkflowSchema = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    SK: {
      type: String,
      rangeKey: true,
    },
    WLFN: {
      type: String,
    },
    R: {
      type: String,
    },
    DATA: {
      type: String,
    },
    FAID: {
      type: String,
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
