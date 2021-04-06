export interface PaginateInterface<T> {
  data: T[];
  totalRecords: number;
  totalPages: number;
  page: number;
  pageSize: number;
}
