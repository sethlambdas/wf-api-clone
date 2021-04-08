import { Schema } from 'dynamoose';

export const WorkflowVersionSchema = new Schema(
  {
    WVID: {
      type: String,
      hashKey: true,
    },
    CID: {
      type: String,
    },
    WID: {
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
