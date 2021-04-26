import { Schema } from 'dynamoose';
import { ACTSchema } from '../workflow-steps/workflow-step.schema';

export const WorkflowExecutionSchema = new Schema(
  {
    WXID: {
      type: String,
      hashKey: true,
    },
    WVID: {
      type: String,
    },
    WSID: {
      type: String,
    },
    CAT: {
      type: Array,
      schema: [ACTSchema],
    },
    STE: {
      type: String,
    },
    isParallel: {
      type: Boolean,
    },
    totalParallelCount: {
      type: Number,
    },
    finishedParallelCount: {
      type: Number,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
