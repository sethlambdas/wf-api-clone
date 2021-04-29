import { Schema } from 'dynamoose';

const LabelSchema = new Schema({
  iconName: {
    type: String,
  },
  name: {
    type: String,
  },
});

const DataSchema = new Schema({
  label: {
    type: Object,
    schema: LabelSchema,
  },
  nodeType: {
    type: String,
  },

  labelIconName: {
    type: String,
  },

  state: {
    type: String,
  },
});

const PositionSchema = new Schema({
  x: {
    type: Number,
  },
  y: {
    type: Number,
  },
});

const DesignWorkflowSchema = new Schema({
  id: {
    type: String,
  },
  source: {
    type: String,
  },
  target: {
    type: String,
  },
  type: {
    type: String,
  },
  style: {
    type: String,
  },
  data: {
    type: Object,
    schema: DataSchema,
  },
  position: {
    type: Object,
    schema: PositionSchema,
  },
});

const ChoiceWorkflowSchema = new Schema({
  Variable: {
    type: String,
  },
  Operator: {
    type: String,
  },
  RightHand: {
    type: String,
  },
  Next: {
    type: String,
  },
});

const MDSchema = new Schema({
  // Email
  Email: {
    type: String,
  },
  Subject: {
    type: String,
  },
  Body: {
    type: String,
  },
  // Delay
  Hours: {
    type: String,
  },
  Minutes: {
    type: String,
  },
  Seconds: {
    type: String,
  },
  // ExactTime
  Date: {
    type: String,
  },
  // Conditional
  Choices: {
    type: Array,
    schema: [ChoiceWorkflowSchema],
  },
  DefaultNext: {
    type: String,
  },
  // ManualInput
  Completed: {
    type: Boolean,
  },
  // AssignData
  FieldValues: {
    type: String,
  },
  // MergeData
  StoreVariable: {
    type: String,
  },
  JoinValues: {
    type: String,
  },
  // WebService
  Endpoint: {
    type: String,
  },
  Name: {
    type: String,
  },
});

export const ACTSchema = new Schema({
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
  DESIGN: {
    type: Array,
    schema: [DesignWorkflowSchema],
  },
  WSID: {
    type: String,
    required: false,
  },
  Status: {
    type: String,
    required: false,
  },
});

export const WorkflowStepSchema = new Schema(
  {
    WSID: {
      type: String,
      hashKey: true,
    },
    WVID: {
      type: String,
    },
    NAID: {
      type: Array,
      schema: [String],
    },
    AID: {
      type: String,
    },
    ACT: {
      type: Object,
      schema: ACTSchema,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
