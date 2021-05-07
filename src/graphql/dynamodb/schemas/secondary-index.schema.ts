import { Schema } from 'dynamoose';
import { GSI } from '../../common/enums/gsi-names.enum';

export const SecondaryIndexes = new Schema(
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
        global: true,
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
