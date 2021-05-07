import { Schema } from 'dynamoose';
import { MDSchema } from '../dynamodb/schemas/act.schema';

const CATSChema = new Schema({
  T: {
    type: String,
  },
  NM: {
    type: String,
  },
  MD: {
    type: Object,
    schema: MDSchema,
  },
  END: {
    type: Boolean,
  },
  WSID: {
    type: String,
  },
  Status: {
    type: String,
  },
});

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
    WXID: {
      type: String,
    },
    CAT: {
      type: Array,
      schema: [CATSChema],
    },
    STE: {
      type: String,
    },
    PARALLEL: {
      type: Array,
      required: false,
      schema: [ParallelSchema],
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
