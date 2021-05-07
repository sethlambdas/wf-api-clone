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
    WVID: {
      type: String,
    },
    CID: {
      type: String,
    },
    WV: {
      type: String,
    },
    FAID: {
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
