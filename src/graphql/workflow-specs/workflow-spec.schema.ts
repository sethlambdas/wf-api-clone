import { Schema } from 'dynamoose';

export const WorkflowSpecSchema = new Schema(
  {
    WSID: {
      type: String,
      hashKey: true,
    },
    WVID: {
      type: String,
    },
    NAID: {
      type: String,
    },
    AID: {
      type: String,
    },
    ACT: {
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
