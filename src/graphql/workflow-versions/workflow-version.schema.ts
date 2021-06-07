import { Schema } from 'dynamoose';

export const WorkflowVersionSchema = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    SK: {
      type: String,
      rangeKey: true,
    },
    CID: {
      type: String,
    },
    WV: {
      type: Number,
    },
    FAID: {
      type: String,
    },
    TotalEXC: {
      type: Number,
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
