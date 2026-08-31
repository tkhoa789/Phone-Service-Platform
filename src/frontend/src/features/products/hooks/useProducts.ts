import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../api/product.api';
import type { 
  ProductListFilterParams, 
  CreateProductCommand, 
  CreateProductVariantCommand 
} from '../types/product.types';
import toast from 'react-hot-toast';

// --- QUERY KEYS ---
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductListFilterParams) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  variants: (productId: string) => [...productKeys.detail(productId), 'variants'] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
};

export const brandKeys = {
  all: ['brands'] as const,
};

// --- QUERIES ---

export function useProducts(filters: ProductListFilterParams) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productApi.getProducts(filters),
    placeholderData: (previousData) => previousData, // Keeps previous data while fetching new page
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productApi.getProductById(id),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: productApi.getCategories,
    staleTime: 1000 * 60 * 60, // 1 hour (mostly static data)
  });
}

export function useBrands() {
  return useQuery({
    queryKey: brandKeys.all,
    queryFn: productApi.getBrands,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useProductVariants(productId: string) {
  return useQuery({
    queryKey: productKeys.variants(productId),
    queryFn: () => productApi.getVariantsByProductId(productId),
    enabled: !!productId,
  });
}

// --- MUTATIONS ---

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: CreateProductCommand) => productApi.createProduct(command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Thêm dòng sản phẩm thành công!');
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productApi.updateProduct,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      toast.success('Cập nhật dòng sản phẩm thành công!');
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Đã xóa dòng sản phẩm!');
    },
  });
}

export function useCreateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: CreateProductVariantCommand) => productApi.createVariant(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.variants(variables.productId) });
      // Invalidate list to ensure aggregate counts/details are updated if any
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Thêm biến thể thành công!');
    },
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productApi.updateVariant,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.variants(variables.command.productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Cập nhật biến thể thành công!');
    },
  });
}

export function useDeleteVariant(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productApi.deleteVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.variants(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Đã xóa biến thể!');
    },
  });
}
