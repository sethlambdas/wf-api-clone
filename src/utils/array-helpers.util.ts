import { chain } from 'lodash';

export const getPaginatedData = (data: any[], sortBy: string[], sortDir: any[], page: number, pageSize: number) => {
  return chain(data)
    .orderBy(sortBy, sortDir)
    .drop((page - 1) * pageSize)
    .take(pageSize)
    .value();
};
