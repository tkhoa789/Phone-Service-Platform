import { axiosClient } from '../utils/axiosClient';
import type {
  ApiResponse,
  PagedResult,
  ProductDto,
  ProductVariantDto,
  CreateProductCommand,
  CreateProductVariantCommand,
  BrandDto,
  CategoryDto,
  SupplierDto
} from '../types/api.types';

export const productService = {
  // Products
  getAll: async (params?: { categoryId?: string; brandId?: string; search?: string; keyword?: string; pageSize?: number; page?: number }): Promise<ProductDto[]> => {
    const keyword = params?.keyword || params?.search;
    const response = await axiosClient.get<ApiResponse<PagedResult<ProductDto> | ProductDto[]>>('/Product', {
      params: {
        categoryId: params?.categoryId,
        brandId: params?.brandId,
        keyword,
        pageSize: params?.pageSize ?? 1000,
        page: params?.page ?? 1,
      }
    });
    const data = response.data.data;
    return 'items' in data ? data.items : data;
  },

  getProducts: async (params?: { categoryId?: string; brandId?: string; search?: string; keyword?: string }): Promise<ProductDto[]> => {
    const keyword = params?.keyword || params?.search;
    const response = await axiosClient.get<ApiResponse<PagedResult<ProductDto> | ProductDto[]>>('/Product', {
      params: {
        categoryId: params?.categoryId,
        brandId: params?.brandId,
        keyword,
      }
    });
    const data = response.data.data;
    return 'items' in data ? data.items : data;
  },

  getById: async (id: string): Promise<ProductDto> => {
    const response = await axiosClient.get<ApiResponse<ProductDto>>(`/Product/${id}`);
    return response.data.data;
  },

  create: async (command: CreateProductCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/Product', command);
    return response.data.data;
  },

  update: async (id: string, command: Partial<CreateProductCommand>): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/Product/${id}`, {
      id,
      ...command,
    });
    return response.data.data;
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/Product/${id}`);
    return response.data.data;
  },

  // Product Variants
  getAllVariants: async (): Promise<ProductVariantDto[]> => {
    const response = await axiosClient.get<ApiResponse<ProductVariantDto[]>>('/Product/Variant');
    return response.data.data;
  },

  getVariants: async (): Promise<ProductVariantDto[]> => {
    return productService.getAllVariants();
  },

  getVariantsByProductId: async (productId: string): Promise<ProductVariantDto[]> => {
    const response = await axiosClient.get<ApiResponse<ProductVariantDto[]>>(`/Product/${productId}/Variants`);
    return response.data.data;
  },

  createVariant: async (command: CreateProductVariantCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/Product/Variant', command);
    return response.data.data;
  },

  updateVariant: async (id: string, command: Partial<CreateProductVariantCommand>): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/Product/Variant/${id}`, {
      id,
      ...command,
    });
    return response.data.data;
  },

  deleteVariant: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/Product/Variant/${id}`);
    return response.data.data;
  },

  // Brands, Categories, Suppliers
  getBrands: async (): Promise<BrandDto[]> => {
    const response = await axiosClient.get<ApiResponse<BrandDto[]>>('/Brand');
    return response.data.data;
  },

  getCategories: async (): Promise<CategoryDto[]> => {
    const response = await axiosClient.get<ApiResponse<CategoryDto[]>>('/Category');
    return response.data.data;
  },

  getSuppliers: async (): Promise<SupplierDto[]> => {
    const response = await axiosClient.get<ApiResponse<SupplierDto[]>>('/Supplier');
    return response.data.data;
  },
};
