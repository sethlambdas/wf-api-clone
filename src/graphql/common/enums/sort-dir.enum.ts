import { registerEnumType } from '@nestjs/graphql';

export enum SortDir {
  'ASC' = 'ASC',
  'DESC' = 'DESC',
}

registerEnumType(SortDir, {
  name: 'SortDir',
});
