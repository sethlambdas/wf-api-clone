import { Schema } from 'dynamoose';

export const UserSchema = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    SK: {
      type: String,
      rangeKey: true,
    },
    NAME: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
