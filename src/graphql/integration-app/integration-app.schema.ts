import { Schema } from 'dynamoose';
import { ClientIntegrationDetailsPlacementOption } from './integration-app.enum';

export const HeaderSchema = new Schema({
  fieldName: {
    type: String,
    required: false,
  },
  fieldValue: {
    type: String,
    required: false,
  },
});

export const AdditionalConfigurationSchema = new Schema({
  fieldName: {
    type: String,
    required: false,
  },
  fieldValue: {
    type: String,
    required: false,
  },
});

export const UrlsSchema = new Schema({
  authorize: {
    type: String,
    required: false,
  },
  token: {
    type: String,
    required: false,
  },
  refreshToken: {
    type: String,
    required: false,
  },
});

export const IntegrationAppsSchema = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    SK: {
      type: String,
      rangeKey: true,
    },
    name: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      enum: ['API_KEY', 'BASIC', 'BEARER', 'OAUTH', 'COOKIE', 'AWS Signature'],
    },
    version: {
      type: Number,
    },
    urls: {
      type: Object,
      schema: UrlsSchema,
    },
    scopes: {
      type: Array,
      schema: [String],
    },
    cookieName: {
      type: String,
    },
    headers: {
      type: Array,
      schema: [HeaderSchema],
    },
    additionalConfiguration: {
      type: Array,
      schema: [AdditionalConfigurationSchema],
    },
    fileUploadType: {
      type: String,
      enum: ['MULTIPART/RELATED', 'MULTIPART/FORM-DATA', 'DIRECT-BODY'],
    },
    addTo: {
      type: String,
      required: false
    },
    apiKeyConfiguration: {
      type: Array,
      schema: [AdditionalConfigurationSchema],
      required: false
    },
    orgId: {
      type: String,
      required: false
    },
    grantType: {
      type: String,
      required: false
    },
    authMethod: {
      type: String,
      required: false
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
