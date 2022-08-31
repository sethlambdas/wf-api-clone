import { Schema } from 'dynamoose';

export const CredentialsSchema = new Schema({
  username: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: false,
  },
  headerName: {
    type: String,
    required: false,
  },
  headerValue: {
    type: String,
    required: false,
  },
});

export const ApigwAuthorizerSchema = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    type: {
      type: String,
      enum: ['NONE', 'BASIC', 'CUSTOM'],
    },
    httpMethod: {
      type: String,
      enum: ['POST', 'PUT', 'GET'],
    },
    credentials: {
      type: Object,
      schema: CredentialsSchema,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
