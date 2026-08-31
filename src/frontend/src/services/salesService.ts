import { axiosClient } from '../utils/axiosClient';
import type {
  ApiResponse,
  SalesOrderDto,
  CreateSalesOrderCommand,
  InvoiceDto,
  CreateInvoiceCommand,
  CreatePaymentCommand,
  PaymentMethodDto,
  VoucherDto
} from '../types/api.types';

export const salesService = {
  // Sales Orders
  getOrders: async (params?: { branchId?: string; status?: string; search?: string }): Promise<SalesOrderDto[]> => {
    const response = await axiosClient.get<ApiResponse<SalesOrderDto[]>>('/SalesOrder', { params });
    return response.data.data;
  },

  getOrderById: async (id: string): Promise<SalesOrderDto> => {
    const response = await axiosClient.get<ApiResponse<SalesOrderDto>>(`/SalesOrder/${id}`);
    return response.data.data;
  },

  createOrder: async (command: CreateSalesOrderCommand, idempotencyKey?: string): Promise<string> => {
    // Backend returns ApiResponse<Guid> (Created Order ID)
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined;
    const response = await axiosClient.post<ApiResponse<string>>('/SalesOrder', command, { headers });
    return response.data.data;
  },

  updateOrderStatus: async (id: string, status: string): Promise<boolean> => {
    // Backend UpdateSalesOrderStatusCommand requires 'id' inside request body
    const response = await axiosClient.put<ApiResponse<boolean>>(`/SalesOrder/${id}/status`, {
      id,
      status,
    });
    return response.data.data;
  },

  deleteOrder: async (id: string): Promise<boolean> => {
    const response = await axiosClient.delete<ApiResponse<boolean>>(`/SalesOrder/${id}`);
    return response.data.data;
  },

  // Invoices & Payments
  getInvoices: async (): Promise<InvoiceDto[]> => {
    const response = await axiosClient.get<ApiResponse<InvoiceDto[]>>('/Invoice');
    return response.data.data;
  },

  getInvoiceById: async (id: string): Promise<InvoiceDto> => {
    const response = await axiosClient.get<ApiResponse<InvoiceDto>>(`/Invoice/${id}`);
    return response.data.data;
  },

  getInvoiceBySalesOrderId: async (salesOrderId: string): Promise<InvoiceDto> => {
    const response = await axiosClient.get<ApiResponse<InvoiceDto>>(`/Invoice/sales-order/${salesOrderId}`);
    return response.data.data;
  },

  createInvoice: async (command: CreateInvoiceCommand): Promise<string> => {
    // Backend returns ApiResponse<Guid> (Created Invoice ID)
    const response = await axiosClient.post<ApiResponse<string>>('/Invoice', command);
    return response.data.data;
  },

  createPayment: async (command: CreatePaymentCommand): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/Invoice/payment', command);
    return response.data.data;
  },

  getPaymentMethods: async (): Promise<PaymentMethodDto[]> => {
    const response = await axiosClient.get<ApiResponse<PaymentMethodDto[]>>('/Invoice/payment-methods');
    return response.data.data;
  },

  cancelInvoice: async (id: string): Promise<boolean> => {
    const response = await axiosClient.put<ApiResponse<boolean>>(`/Invoice/${id}/cancel`);
    return response.data.data;
  },

  // Vouchers
  validateVoucher: async (code: string): Promise<VoucherDto> => {
    const response = await axiosClient.get<ApiResponse<VoucherDto>>(`/Voucher/validate/${code}`);
    return response.data.data;
  },
};
