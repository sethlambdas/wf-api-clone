import { Schema } from 'dynamoose';
import { GSI } from '../common/enums/gsi-names.enum';

export const UserSchema = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    name: {
      type: String,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
      index: {
        global: true,
        name: `${GSI.GSIEmailIndex}`,
      },
    },
    password: {
      type: String,
    },
    salt: {
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
