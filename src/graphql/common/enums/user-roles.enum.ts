import { registerEnumType } from '@nestjs/graphql';

export enum UserRoleEnum {
  ADMINISTRATOR = 'ADMINISTRATOR', // full access
  MODERATOR = 'MODERATOR', // view access to workflow, stripe billing, users
  DEVELOPER = 'DEVELOPER', // access to workflow creation/test page
  GUEST = 'GUEST', // user who wants to try the workflow app for a certain period of time or executions (limited resources)
}

registerEnumType(UserRoleEnum, {
  name: 'UserRoleEnum',
  description: 'User role types',
  valuesMap: {
    ADMINISTRATOR: {
      description: 'all access',
    },
    MODERATOR: {
      description: 'view access to workflow, stripe billing, users',
    },
    DEVELOPER: {
      description: 'access to workflow creation/test page',
    },
    GUEST: {
      description: 'user who wants to try the workflow app for a certain period of time or executions (limited resources)',
    },
  },
});
