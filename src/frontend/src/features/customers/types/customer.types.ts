import type { 
  CustomerDto, 
  CreateCustomerCommand,
  PaginatedResponse 
} from '../../../types/api.types';

export type {
  CustomerDto,
  CreateCustomerCommand,
  PaginatedResponse
};

export interface CustomerListFilterParams {
  page: number;
  pageSize: number;
  keyword?: string; // Backend GetCustomersQuery uses 'keyword'
}
