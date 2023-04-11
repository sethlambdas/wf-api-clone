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
    },
    type: {
      type: String,
      enum: ['API-KEY', 'BASIC', 'OAUTH', 'COOKIE','AWS Signature'],
    },
    clientDetailsPlacement: {
      type: String,
      enum: ['BODY', 'QUERY_PARAMS', 'HEADERS'],
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
    fileUploadType: {
      type: String,
      enum: ['MULTIPART/RELATED', 'MULTIPART/FORM-DATA', 'DIRECT-BODY'],
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
