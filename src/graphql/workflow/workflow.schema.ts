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
    FAID: {
      type: String,
    },
    STATUS: {
      type: String,
    },
    WLFN: {
      type: String,
    },
    UQ_OVL: {
      type: String,
    },

    // to be decided
    R: {
      type: String,
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
