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
  Status: {
    type: Number,
  },
  // Delay
  Hours: {
    type: String,
  },
  Minutes: {
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
  Files: {
    type: String,
  },
  FileFilter: {
    type: String,
  },
  FileTypeOption: {
    type: String,
  },
  MultipartContentType: {
    type: String,
  },
  MultipartMetaData: {
    type: String,
  },
  webServiceDownloadFile: {
    type: Boolean,
  },
  targetFileName: {
    type: String,
  },
  Evaluations: {
    type: String,
  },
  Retries: {
    type: Number,
  },
  Interval: {
    type: Number,
  },
  ErrorAction: {
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
  OrgId: {
    type: String,
  },
  // TimedTrigger
  ScheduleType: {
    type: String,
  },
  // TimedTrigger-Interval
  RateValue: {
    type: String,
  },
  RateUnit: {
    type: String,
  },
  // TimedTrigger-ExactTime
  ExactTime: {
    type: String,
  },
  // TimedTrigger-Cron
  Cron: {
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
  // RCE
  code: {
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

export const StyleSchema = new Schema({
  stroke: {
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
    type: Object,
    schema: StyleSchema,
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
