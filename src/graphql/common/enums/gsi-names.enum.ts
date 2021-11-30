import { registerEnumType } from '@nestjs/graphql';

export enum GSI {
  'DataOverloading' = 'DataOverloading',
  'UniqueKeyOverloading' = 'UniqueKeyOverloading',
}

registerEnumType(GSI, {
  name: 'GSI',
});
