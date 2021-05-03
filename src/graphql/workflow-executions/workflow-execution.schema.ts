import { Schema } from 'dynamoose';
import { ACTSchema } from '../workflow-steps/workflow-step.schema';

const ParallelSchema = new Schema({
  isParallelActive: {
    type: Boolean,
  },
  totalParallelCount: {
    type: Number,
  },
  finishedParallelCount: {
    type: Number,
  },
});

export const WorkflowExecutionSchema = new Schema(
  {
    WXID: {
      type: String,
      hashKey: true,
    },
    WVID: {
      type: String,
    },
    CAT: {
      type: Array,
      schema: [ACTSchema],
    },
    STE: {
      type: String,
    },
    PARALLEL: {
      type: Array,
      schema: [ParallelSchema],
    },
    WLFN: {
      type: String,
    },
    CRAT: {
      type: String,
      required: true,
      index: {
        global: true,
        rangeKey: 'WXID',
        name: 'GetCRAT',
        project: true,
        throughput: 5,
      },
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
