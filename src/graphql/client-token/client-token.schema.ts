import { Schema } from 'dynamoose';

export const ClientTokenSchema = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    expTime: {
      type: Number,
      required: false,
    },
    clientPK: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
