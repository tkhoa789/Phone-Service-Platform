import type { 
  ProductDto, 
  ProductVariantDto, 
  CreateProductCommand, 
  CreateProductVariantCommand,
  CategoryDto,
  BrandDto,
  SupplierDto,
  PaginatedResponse
} from '../../../types/api.types';

export type {
  ProductDto,
  ProductVariantDto,
  CreateProductCommand,
  CreateProductVariantCommand,
  CategoryDto,
  BrandDto,
  SupplierDto,
  PaginatedResponse
};

// Additional feature-local types can go here
export interface ProductListFilterParams {
  page: number;
  pageSize: number;
  keyword?: string;
  search?: string;
  categoryId?: string;
  brandId?: string;
}
