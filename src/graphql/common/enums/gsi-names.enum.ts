import { registerEnumType } from '@nestjs/graphql';

export enum GSI {
  'DataOverloading' = 'DataOverloading',
  'GetActivityTypeAccordingToStatus' = 'GetActivityTypeAccordingToStatus',
}

registerEnumType(GSI, {
  name: 'GSI',
});
