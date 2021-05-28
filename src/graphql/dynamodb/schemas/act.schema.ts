import { Schema } from 'dynamoose';

export const ChoiceWorkflowSchema = new Schema({
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

export const MDSchema = new Schema({
  // Email or ManualApproval
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
  // ManualApproval
  Completed: {
    type: Boolean,
  },
  ApproveStep: {
    type: String,
  },
  RejectStep: {
    type: String,
  },
  Purpose: {
    type: String,
  },
  // FormEditor
  FormDataSchema: {
    type: String,
  },
  FormUiSchema: {
    type: String,
  },
  FormData: {
    type: String,
  },
});

export const LabelSchema = new Schema({
  iconName: {
    type: String,
  },
  name: {
    type: String,
  },
});

export const DataSchema = new Schema({
  label: {
    type: Object,
    schema: LabelSchema,
  },
  nodeType: {
    type: String,
  },
  labelIconName: {
    type: String,
    required: false,
  },
  state: {
    type: String,
  },
  variables: {
    type: Object,
    schema: MDSchema,
  },
});

export const PositionSchema = new Schema({
  x: {
    type: Number,
  },
  y: {
    type: Number,
  },
});

export const DesignWorkflowSchema = new Schema({
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
    required: false,
  },
  END: {
    type: Boolean,
  },
  DESIGN: {
    type: Array,
    schema: [DesignWorkflowSchema],
  },
});
