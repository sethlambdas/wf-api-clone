import { Schema } from 'dynamoose';

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
    PK: {
      type: String,
      hashKey: true,
    },
    SK: {
      type: String,
      rangeKey: true,
    },
    WSXH_IDS: {
      type: Array,
      schema: [String],
    },
    STE: {
      type: String,
    },
    PARALLEL: {
      type: Array,
      required: false,
      schema: [ParallelSchema],
    },
    STATUS: {
      type: String,
    },

    subscriptionItem: {
      type: String,
    },

    usageRecordId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
