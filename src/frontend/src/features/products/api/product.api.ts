import { axiosClient } from '../../../utils/axiosClient';
import type { ApiResponse, PagedResult } from '../../../types/api.types';
import type {
  ProductDto,
  ProductVariantDto,
  CreateProductCommand,
  CreateProductVariantCommand,
  CategoryDto,
  BrandDto,
  SupplierDto,
  ProductListFilterParams
} from '../types/product.types';

export const productApi = {
  // PRODUCTS
  getProducts: async (params: ProductListFilterParams): Promise<PagedResult<ProductDto>> => {
    const response = await axiosClient.get<ApiResponse<PagedResult<ProductDto>>>('/Product', { params });
    return response.data.data;
  },

  getProductById: async (id: string): Promise<ProductDto> => {
    const response = await axiosClient.get<ApiResponse<ProductDto>>(`/Product/${id}`);
    return response.data.data;
  },

  createProduct: async (command: CreateProductCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/Product', command);
    return response.data.data;
  },

  updateProduct: async (params: { id: string; command: CreateProductCommand }): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/Product/${params.id}`, {
      id: params.id,
      ...params.command,
    });
    return response.data.data;
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/Product/${id}`);
    return response.data.data;
  },

  // VARIANTS
  getVariantsByProductId: async (productId: string): Promise<ProductVariantDto[]> => {
    const response = await axiosClient.get<ApiResponse<ProductVariantDto[]>>(`/Product/${productId}/Variants`);
    return response.data.data;
  },

  createVariant: async (command: CreateProductVariantCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/Product/Variant', command);
    return response.data.data;
  },

  updateVariant: async (params: { id: string; command: CreateProductVariantCommand }): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/Product/Variant/${params.id}`, {
      id: params.id,
      ...params.command,
    });
    return response.data.data;
  },

  deleteVariant: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/Product/Variant/${id}`);
    return response.data.data;
  },

  // DEPENDENCIES
  getCategories: async (): Promise<CategoryDto[]> => {
    const response = await axiosClient.get<ApiResponse<CategoryDto[]>>('/Category');
    return response.data.data;
  },

  getBrands: async (): Promise<BrandDto[]> => {
    const response = await axiosClient.get<ApiResponse<BrandDto[]>>('/Brand');
    return response.data.data;
  }
};
