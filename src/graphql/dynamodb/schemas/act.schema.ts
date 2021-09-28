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
  Choice: {
    type: Array,
    schema: [ChoiceWorkflowSchema],
  },
  DefaultNext: {
    type: String,
  },
  // AssignData
  CustomVariables: {
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
  Method: {
    type: String,
  },
  ClientPK: {
    type: String,
  },
  ClientSK: {
    type: String,
  },
  Headers: {
    type: String,
  },
  QueryStrings: {
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
  // Trigger Type
  IsTrigger: {
    type: Boolean,
  },
  // HTTP
  AID: {
    type: String,
  },
  // External Services
  ExternalServiceAction: {
    type: String,
  },
  // Email Ingestion Service
  Password: {
    type: String,
  },
  Host: {
    type: String,
  },
  Port: {
    type: Number,
  },
  TLS: {
    type: Boolean,
  },
  source_folder: {
    type: String,
  },
  destination_folder: {
    type: String,
  },
  // OCR
  TesseractConfig: {
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

export const APIKeySchema = new Schema({
  KEY: {
    type: String,
  },
  ACTIVE: {
    type: Boolean,
  },
});
