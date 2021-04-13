import { Schema } from 'dynamoose';

export const WorkflowExecutionSchema = new Schema(
  {
    WXID: {
      type: String,
      hashKey: true,
    },
    WSID: {
      type: String,
    },
    CAT: {
      type: String,
    },
    STE: {
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
