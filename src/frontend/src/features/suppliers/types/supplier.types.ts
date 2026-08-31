export interface SupplierDto {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  taxCode?: string;
  debtAmount: number;
  creditLimit?: number;
  paymentTermsDays?: number;
  status?: 'Active' | 'Inactive';
  createdAt: string;
}

export interface CreateSupplierCommand {
  code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  taxCode?: string;
  debtAmount?: number;
  creditLimit?: number;
  paymentTermsDays?: number;
}

export interface SupplierDebtTransactionDto {
  id: string;
  supplierId: string;
  transactionType: 'INVOICE' | 'PAYMENT' | 'DEBIT_NOTE';
  amount: number;
  balanceAfter: number;
  referenceNo: string;
  paymentMethod?: string;
  note?: string;
  createdAt: string;
  createdBy?: string;
}

export interface PaySupplierDebtCommand {
  supplierId: string;
  amount: number;
  paymentMethod: string;
  referenceNo: string;
  note?: string;
}

export interface SupplierListFilterParams {
  keyword?: string;
  page: number;
  pageSize: number;
}
