import { Schema } from 'dynamoose';
import { GSI } from '../../common/enums/gsi-names.enum';

export const workflowSecondaryIndexes = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    SK: {
      type: String,
      rangeKey: true,
    },
    UQ_OVL: {
      type: String,
      index: {
        type: 'global',
        rangeKey: 'SK',
        name: `${GSI.UniqueKeyOverloading}`,
        project: true,
        throughput: 5,
      },
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

export const workflowVersionsSecondaryIndexes = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    SK: {
      type: String,
      rangeKey: true,
    },
    DATA: {
      type: String,
      index: {
        type: 'global',
        rangeKey: 'PK',
        name: `${GSI.DataOverloading}`,
        project: true,
        throughput: 5,
      },
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

export const workflowExecutionsSecondaryIndexes = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    SK: {
      type: String,
      rangeKey: true,
    },
    UQ_OVL: {
      type: String,
      index: {
        type: 'global',
        rangeKey: 'SK',
        name: `${GSI.UniqueKeyOverloading}`,
        project: true,
        throughput: 5,
      },
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);
