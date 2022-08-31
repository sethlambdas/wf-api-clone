import { registerEnumType } from '@nestjs/graphql';

export enum GSI {
  'DataOverloading' = 'DataOverloading',
  'UniqueKeyOverloading' = 'UniqueKeyOverloading',
  'GSIEmailIndex' = 'GSIEmailIndex',
}

registerEnumType(GSI, {
  name: 'GSI',
});
