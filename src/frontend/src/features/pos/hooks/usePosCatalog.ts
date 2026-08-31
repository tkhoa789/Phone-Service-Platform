import { useQuery } from '@tanstack/react-query';
import { productService } from '../../../services/productService';
import { customerService } from '../../../services/customerService';
import { voucherService } from '../../../services/voucherService';

export const posKeys = {
  all: ['pos'] as const,
  products: () => [...posKeys.all, 'products'] as const,
  variants: () => [...posKeys.all, 'variants'] as const,
  categories: () => [...posKeys.all, 'categories'] as const,
  customers: () => [...posKeys.all, 'customers'] as const,
};

export function usePosProducts() {
  return useQuery({
    queryKey: posKeys.products(),
    queryFn: () => productService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePosVariants() {
  return useQuery({
    queryKey: posKeys.variants(),
    queryFn: () => productService.getAllVariants(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePosCategories() {
  return useQuery({
    queryKey: posKeys.categories(),
    queryFn: () => productService.getCategories(),
    staleTime: 60 * 60 * 1000,
  });
}

export function usePosCustomers() {
  return useQuery({
    queryKey: posKeys.customers(),
    queryFn: () => customerService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useValidateVoucher(code: string, enabled: boolean) {
  return useQuery({
    queryKey: ['voucher', code],
    queryFn: () => voucherService.validate(code),
    enabled,
    retry: false, // Don't retry if invalid voucher
  });
}
