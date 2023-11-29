import { Schema } from 'dynamoose';

export const EnvironmentValuesSchema = new Schema({
  fieldName: {
    type: String,
  },
  fieldValue: {
    type: String,
  },
  default: {
    type: Boolean,
    required: false,
  },
});

export const GlobalVariableSchema = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    environmentValues: {
      schema: [EnvironmentValuesSchema],
      type: Array,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
