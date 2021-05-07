import { registerEnumType } from '@nestjs/graphql';

export enum GSI {
  'DataOverloading' = 'DataOverloading',
}

registerEnumType(GSI, {
  name: 'GSI',
});
