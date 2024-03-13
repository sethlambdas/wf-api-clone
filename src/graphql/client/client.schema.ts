import { Schema } from 'dynamoose';
import { HeaderSchema } from '../integration-app/integration-app.schema';
import { ClientStatus } from '../common/enums/authentication.enum';

export const SecretsSchema = new Schema({
  apiKey: {
    type: String,
    required: false,
  },
  clientId: {
    type: String,
    required: false,
  },
  clientSecret: {
    type: String,
    required: false,
  },
  username: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: false,
  },
  organisation: {
    type: String,
    required: false,
  },
  hostId: {
    type: String,
    required: false,
  },
  rootUrl: {
    type: String,
    required: false,
  },
  cookie: {
    type: String,
    required: false,
  },
  accessKey: {
    type: String,
    required: false,
  },
  secretKey: {
    type: String,
    required: false,
  },
});

export const MetadataSchema = new Schema({
  shopifyStore: {
    type: String,
    required: false,
  },
});

export const ClientSchema = new Schema(
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
      required: false
    },
    type: {
      type: String,
      enum: ['API_KEY', 'BASIC', 'BEARER', 'OAUTH', 'COOKIE', 'AWS Signature'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DISABLED'],
      default: ClientStatus.ACTIVE
    },
    fileUploadType: {
      type: String,
      enum: ['MULTIPART/RELATED', 'MULTIPART/FORM-DATA', 'DIRECT-BODY'],
      required: false
    },
    intAppId: {
      type: String,
    },
    secrets: {
      type: Object,
      schema: SecretsSchema,
    },
    scopes: {
      type: Array,
      schema: [String],
    },
    metadata: {
      type: Object,
      schema: MetadataSchema,
    },
    headers: {
      type: Array,
      schema: [HeaderSchema],
    },
    apiKeyConfigurations: {
      type: Array,
      schema: [HeaderSchema],
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
