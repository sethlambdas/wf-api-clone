import { Schema } from 'dynamoose';
import { GSI } from '../common/enums/gsi-names.enum';
import { UserRoleEnum } from '../common/enums/user-roles.enum';

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
        type: 'global',
        name: `${GSI.GSIEmailIndex}`,
      },
    },
    role: {
      type: String,
      enum: [
        UserRoleEnum.ADMINISTRATOR,
        UserRoleEnum.DEVELOPER,
        UserRoleEnum.TRIAL,
        UserRoleEnum.MODERATOR,
        UserRoleEnum.SUPPORT,
      ],
      default: UserRoleEnum.SUPPORT,
    },
    password: {
      type: String,
    },
    salt: {
      type: String,
    },
    stripeCustomerId: {
      type: String,
    },
    subscriptionId: {
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
