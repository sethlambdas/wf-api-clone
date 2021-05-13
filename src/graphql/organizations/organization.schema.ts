import { Schema } from 'dynamoose';

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
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
