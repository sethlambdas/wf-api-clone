import { Schema } from 'dynamoose';
import { APIKeySchema } from '../dynamodb/schemas/act.schema';

export const OrganizationSchema = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    ORGNAME: {
      type: String,
    },
    TotalWLF: {
      type: Number,
    },
    TotalUSR: {
      type: Number,
    },
    APIKEY: {
      type: Array,
      schema: [APIKeySchema],
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
