import { axiosClient } from '../utils/axiosClient';
import type { ApiResponse } from '../types/api.types';

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

const DEFAULT_SUPPLIERS: SupplierDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    code: 'NCC-APPLE-VN',
    name: 'Công ty TNHH Linh Kiện Điện Thoại Apple Việt Nam',
    phone: '0908889999',
    email: 'linhkien@apple-vn.com',
    address: '456 Lê Hồng Phong, Quận 10, TP.HCM',
    taxCode: '0312345678',
    debtAmount: 255000000,
    creditLimit: 300000000,
    paymentTermsDays: 30,
    status: 'Active',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    code: 'NCC-SAIGON-PARTS',
    name: 'Tổng Kho Linh Kiện Sài Gòn Phụ Kiện',
    phone: '0912334455',
    email: 'sales@saigonparts.vn',
    address: '789 Hùng Vương, Quận 5, TP.HCM',
    taxCode: '0387654321',
    debtAmount: 120000000,
    creditLimit: 100000000,
    paymentTermsDays: 15,
    status: 'Active',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    code: 'NCC-DUNG-CU-SUA',
    name: 'Thiết Bị & Dụng Cụ Sửa Chữa Chuyên Nghiệp TQ',
    phone: '0933445566',
    email: 'thietbi@dungcusua.com',
    address: '12 An Dương Vương, Quận 5, TP.HCM',
    taxCode: '0355667788',
    debtAmount: 0,
    creditLimit: 200000000,
    paymentTermsDays: 30,
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
];

const getLocalSuppliers = (): SupplierDto[] => {
  const saved = localStorage.getItem('psp_suppliers_cache');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return DEFAULT_SUPPLIERS;
};

const saveLocalSuppliers = (suppliers: SupplierDto[]) => {
  localStorage.setItem('psp_suppliers_cache', JSON.stringify(suppliers));
};

const getLocalLedgers = (supplierId: string): SupplierDebtTransactionDto[] => {
  const saved = localStorage.getItem(`psp_supplier_ledger_${supplierId}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return [
    {
      id: 'tx-1',
      supplierId,
      transactionType: 'INVOICE',
      amount: 255000000,
      balanceAfter: 255000000,
      referenceNo: 'GRN-260801-001',
      paymentMethod: 'DEBT',
      note: 'Nhập lô 50 màn hình iPhone 15 Pro Max & 20 Pin Pisen',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'admin',
    },
  ];
};

const saveLocalLedgers = (supplierId: string, transactions: SupplierDebtTransactionDto[]) => {
  localStorage.setItem(`psp_supplier_ledger_${supplierId}`, JSON.stringify(transactions));
};

export const supplierService = {
  getAll: async (): Promise<SupplierDto[]> => {
    try {
      const response = await axiosClient.get<ApiResponse<SupplierDto[]>>('/Supplier');
      const items = response.data?.data || [];
      if (items.length > 0) {
        const mapped = items.map((item) => ({
          ...item,
          creditLimit: item.creditLimit || 500000000,
          paymentTermsDays: item.paymentTermsDays || 30,
          status: item.status || 'Active',
        }));
        saveLocalSuppliers(mapped);
        return mapped;
      }
    } catch {
      // fallback
    }
    return getLocalSuppliers();
  },

  getById: async (id: string): Promise<SupplierDto> => {
    try {
      const response = await axiosClient.get<ApiResponse<SupplierDto>>(`/Supplier/${id}`);
      if (response.data?.data) return response.data.data;
    } catch {
      // fallback
    }
    const local = getLocalSuppliers().find((s) => s.id === id);
    if (local) return local;
    throw new Error('Không tìm thấy Nhà cung cấp');
  },

  create: async (command: CreateSupplierCommand): Promise<SupplierDto> => {
    try {
      const response = await axiosClient.post<ApiResponse<SupplierDto>>('/Supplier', command);
      if (response.data?.data) return response.data.data;
    } catch {
      // fallback
    }
    const newSupplier: SupplierDto = {
      id: `00000000-0000-0000-0000-${Date.now().toString().padStart(12, '0')}`,
      ...command,
      debtAmount: command.debtAmount || 0,
      creditLimit: command.creditLimit || 500000000,
      paymentTermsDays: command.paymentTermsDays || 30,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    const current = getLocalSuppliers();
    const updated = [newSupplier, ...current];
    saveLocalSuppliers(updated);
    return newSupplier;
  },

  update: async (id: string, command: Partial<CreateSupplierCommand>): Promise<boolean> => {
    try {
      const response = await axiosClient.put<ApiResponse<boolean>>(`/Supplier/${id}`, { id, ...command });
      if (response.data?.data !== undefined) return response.data.data;
    } catch {
      // fallback
    }
    const current = getLocalSuppliers();
    const updated = current.map((s) => (s.id === id ? { ...s, ...command } : s));
    saveLocalSuppliers(updated);
    return true;
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      const response = await axiosClient.delete<ApiResponse<boolean>>(`/Supplier/${id}`);
      if (response.data?.data !== undefined) return response.data.data;
    } catch {
      // fallback
    }
    const current = getLocalSuppliers();
    const updated = current.filter((s) => s.id !== id);
    saveLocalSuppliers(updated);
    return true;
  },

  payDebt: async (command: PaySupplierDebtCommand): Promise<boolean> => {
    try {
      const response = await axiosClient.post<ApiResponse<boolean>>(`/Supplier/${command.supplierId}/pay`, command);
      if (response.data?.data !== undefined) {
        // also update local cache
        const suppliers = getLocalSuppliers().map((s) => {
          if (s.id === command.supplierId) {
            const newDebt = Math.max(0, s.debtAmount - command.amount);
            return { ...s, debtAmount: newDebt };
          }
          return s;
        });
        saveLocalSuppliers(suppliers);
        return response.data.data;
      }
    } catch {
      // fallback
    }

    // Update local cache
    const suppliers = getLocalSuppliers().map((s) => {
      if (s.id === command.supplierId) {
        const newDebt = Math.max(0, s.debtAmount - command.amount);

        // Record transaction
        const ledgers = getLocalLedgers(command.supplierId);
        const newTx: SupplierDebtTransactionDto = {
          id: `tx-${Date.now()}`,
          supplierId: command.supplierId,
          transactionType: 'PAYMENT',
          amount: command.amount,
          balanceAfter: newDebt,
          referenceNo: command.referenceNo,
          paymentMethod: command.paymentMethod,
          note: command.note,
          createdAt: new Date().toISOString(),
          createdBy: 'admin',
        };
        saveLocalLedgers(command.supplierId, [newTx, ...ledgers]);

        return { ...s, debtAmount: newDebt };
      }
      return s;
    });
    saveLocalSuppliers(suppliers);
    return true;
  },

  getDebtLedger: async (supplierId: string): Promise<SupplierDebtTransactionDto[]> => {
    try {
      const response = await axiosClient.get<ApiResponse<SupplierDebtTransactionDto[]>>(`/Supplier/${supplierId}/ledger`);
      if (response.data?.data && response.data.data.length > 0) return response.data.data;
    } catch {
      // fallback
    }
    return getLocalLedgers(supplierId);
  },
};
