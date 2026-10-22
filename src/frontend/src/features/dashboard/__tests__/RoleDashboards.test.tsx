import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SalesDashboard } from '../components/role-dashboards/SalesDashboard';
import { TechnicianDashboard } from '../components/role-dashboards/TechnicianDashboard';
import { WarrantyDashboard } from '../components/role-dashboards/WarrantyDashboard';
import { InventoryDashboard } from '../components/role-dashboards/InventoryDashboard';
import { salesService } from '../../../services/salesService';
import { serviceService } from '../../../services/serviceService';
import { inventoryService } from '../../inventory/services/inventory.service';
import { getPurchaseOrders } from '../../purchase-orders/api/purchaseOrdersApi';

// Mock auth store
const mockAuthStore = vi.fn();
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => mockAuthStore(),
}));

// Mock branch store
vi.mock('../../../stores/branchStore', () => ({
  useBranchStore: () => ({
    activeBranchId: 'branch-nt1',
    activeBranchName: 'Chi nhánh Nha Trang 1',
  }),
}));

// Mock theme store
vi.mock('../../../stores/themeStore', () => ({
  useThemeStore: () => ({
    language: 'vi',
  }),
}));

// Mock services
vi.mock('../../../services/salesService', () => ({
  salesService: {
    getOrders: vi.fn(),
    getOrderById: vi.fn(),
  },
}));

vi.mock('../../../services/serviceService', () => ({
  serviceService: {
    getRepairs: vi.fn(),
    getWarranties: vi.fn(),
    checkWarrantyStatus: vi.fn(),
  },
}));

vi.mock('../../inventory/services/inventory.service', () => ({
  inventoryService: {
    getInventory: vi.fn(),
  },
}));

vi.mock('../../purchase-orders/api/purchaseOrdersApi', () => ({
  getPurchaseOrders: vi.fn(),
}));

// Mock router navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Role-Aware Operational Dashboards — In-Depth Feature Verification', () => {
  let testQueryClient: QueryClient;

  beforeEach(() => {
    testQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('SalesDashboard', () => {
    it('calculates today sales, AOV, order count and renders branch order queue', async () => {
      mockAuthStore.mockReturnValue({
        user: { id: 'u-sales', fullName: 'Nguyen Van Sales', email: 'sales@psp.vn' },
        roles: ['Sales'],
        hasPermission: () => true,
      });

      const todayIso = new Date().toISOString();
      const mockOrders = [
        {
          id: 'ord-1',
          code: 'SO-2026-001',
          customerName: 'Le Thi Khach',
          customerPhone: '0901234567',
          status: 'Completed',
          total: 25000000,
          createdAt: todayIso,
          items: [
            {
              productVariantId: 'pv-1',
              productName: 'Galaxy S24 Ultra',
              sku: 'SKU_S24',
              quantity: 1,
              total: 25000000,
            },
          ],
        },
        {
          id: 'ord-2',
          code: 'SO-2026-002',
          customerName: 'Tran Van Mua',
          status: 'Pending',
          total: 5000000,
          createdAt: todayIso,
          items: [],
        },
      ];

      vi.mocked(salesService.getOrders).mockResolvedValue(mockOrders as any);

      renderComponent(<SalesDashboard />);

      // Verify Header & Scope
      expect(screen.getByText('Bàn Làm Việc Bán Hàng & Thu Ngân')).toBeInTheDocument();
      expect(screen.getByText('Chuyên Viên Bán Hàng (Sales)')).toBeInTheDocument();
      expect(screen.getByText('Chi nhánh Nha Trang 1')).toBeInTheDocument();

      // Verify async elements using findByText
      expect(await screen.findByText('SO-2026-001')).toBeInTheDocument();
      const amountElements = await screen.findAllByText('25.000.000 ₫');
      expect(amountElements.length).toBeGreaterThan(0);
      expect(await screen.findByText('Le Thi Khach')).toBeInTheDocument();
      expect(await screen.findByText('Hoàn tất')).toBeInTheDocument();
      expect(await screen.findByText('Galaxy S24 Ultra')).toBeInTheDocument();
    });
  });

  describe('TechnicianDashboard', () => {
    it('renders assigned repairs, intake queue and allows tab switching', async () => {
      mockAuthStore.mockReturnValue({
        user: { id: 'tech-99', fullName: 'KTV Tran Tech', email: 'tech@psp.vn' },
        roles: ['Technician'],
        hasPermission: () => true,
      });

      const mockRepairs = {
        items: [
          {
            id: 'rep-1',
            code: 'REP-101',
            technicianId: 'tech-99',
            deviceModel: 'iPhone 15 Pro Max',
            imei: '356789123456789',
            problemDescription: 'Bể mặt kính cảm ứng',
            customerName: 'Nguyen Van A',
            status: 'Repairing',
          },
          {
            id: 'rep-2',
            code: 'REP-102',
            technicianId: null,
            deviceModel: 'Samsung Galaxy Z Fold 5',
            problemDescription: 'Khởi động treo logo',
            customerName: 'Bui Van B',
            status: 'Received',
          },
          {
            id: 'rep-3',
            code: 'REP-103',
            technicianId: 'tech-99',
            deviceModel: 'Xiaomi 13 Pro',
            problemDescription: 'Pin chai phù nắp lưng',
            customerName: 'Le Thi C',
            status: 'WaitingForParts',
          },
        ],
        totalCount: 3,
      };

      vi.mocked(serviceService.getRepairs).mockResolvedValue(mockRepairs as any);

      renderComponent(<TechnicianDashboard />);

      // Verify Header & Scope
      expect(screen.getByText('Không Gian Kỹ Thuật Viên Sửa Chữa')).toBeInTheDocument();
      expect(screen.getByText('Kỹ Thuật Viên Sửa Chữa (Technician)')).toBeInTheDocument();

      // Wait for table to populate
      expect(await screen.findByText('REP-101')).toBeInTheDocument();
      expect(await screen.findByText('iPhone 15 Pro Max')).toBeInTheDocument();

      // Click tab "Hàng Đợi Tiếp Nhận Chi Nhánh"
      const branchTab = screen.getByText('Hàng Đợi Tiếp Nhận Chi Nhánh');
      fireEvent.click(branchTab);

      // Verify unassigned ticket in queue
      expect(await screen.findByText('REP-102')).toBeInTheDocument();
      expect(await screen.findByText('Samsung Galaxy Z Fold 5')).toBeInTheDocument();
    });
  });

  describe('WarrantyDashboard', () => {
    it('renders warranty claims and allows interactive IMEI lookup', async () => {
      mockAuthStore.mockReturnValue({
        user: { id: 'w-1', fullName: 'Specialist Vo Warranty', email: 'warranty@psp.vn' },
        roles: ['Warranty'],
        hasPermission: () => true,
      });

      const mockWarranties = {
        items: [
          {
            id: 'war-1',
            code: 'WAR-001',
            productName: 'iPad Pro M2',
            imei: '358999888777666',
            customerName: 'Hoang Thi D',
            createdAt: '2026-09-01T00:00:00Z',
            status: 'Processing',
          },
        ],
        totalCount: 1,
      };

      vi.mocked(serviceService.getWarranties).mockResolvedValue(mockWarranties as any);
      vi.mocked(serviceService.checkWarrantyStatus).mockResolvedValue({
        isUnderWarranty: true,
        imei: '358999888777666',
        productName: 'iPad Pro M2 128GB',
        customerName: 'Hoang Thi D',
        warrantyExpirationDate: '2027-09-01T00:00:00Z',
        remainingDays: 361,
      } as any);

      renderComponent(<WarrantyDashboard />);

      // Verify Header
      expect(screen.getByText('Trung Tâm Tiếp Nhận & Xử Lý Bảo Hành')).toBeInTheDocument();
      expect(screen.getByText('Chuyên Viên Bảo Hành (Warranty)')).toBeInTheDocument();

      // Verify Table Claim
      expect(await screen.findByText('WAR-001')).toBeInTheDocument();
      expect(await screen.findByText('iPad Pro M2')).toBeInTheDocument();

      // Perform IMEI Search
      const input = screen.getByPlaceholderText('VD: 356890123456789');
      fireEvent.change(input, { target: { value: '358999888777666' } });
      const submitBtn = screen.getByText('Tra');
      fireEvent.click(submitBtn);

      expect(await screen.findByText('Còn bảo hành')).toBeInTheDocument();
      expect(await screen.findByText('iPad Pro M2 128GB')).toBeInTheDocument();
      expect(await screen.findByText('361 ngày')).toBeInTheDocument();
    });
  });

  describe('InventoryDashboard', () => {
    it('renders stocked SKUs, units, low stock warnings, and pending purchase orders', async () => {
      mockAuthStore.mockReturnValue({
        user: { id: 'inv-1', fullName: 'Pham Van Kho', email: 'inventory@psp.vn' },
        roles: ['Inventory'],
        hasPermission: () => true,
      });

      const mockInventory = [
        {
          id: 'inv-item-1',
          variantName: 'Màn hình OLED iPhone 15',
          sku: 'PART_IP15_SCR',
          warehouseName: 'Kho Nha Trang',
          quantity: 2,
          minimumStock: 5,
          isLowStock: true,
        },
        {
          id: 'inv-item-2',
          variantName: 'Galaxy S24 Ultra Master',
          sku: 'SKU_S24',
          warehouseName: 'Kho Nha Trang',
          quantity: 20,
          minimumStock: 5,
          isLowStock: false,
        },
      ];

      const mockPOs = [
        {
          id: 'po-1',
          code: 'PO-2026-001',
          supplierName: 'Apple Authorized Distributor VN',
          status: 'Confirmed',
          totalAmount: 150000000,
          createdAt: '2026-09-02T00:00:00Z',
        },
      ];

      vi.mocked(inventoryService.getInventory).mockResolvedValue(mockInventory as any);
      vi.mocked(getPurchaseOrders).mockResolvedValue(mockPOs as any);

      renderComponent(<InventoryDashboard />);

      // Verify Header
      expect(screen.getByText('Trung Tâm Quản Lý Kho Bãi & Cung Ứng')).toBeInTheDocument();
      expect(screen.getByText('Quản Lý Kho & Cung Ứng (Inventory)')).toBeInTheDocument();

      // Verify KPIs
      expect(await screen.findByText('Mặt Hàng Quản Lý (SKU)')).toBeInTheDocument();
      expect(await screen.findByText('2')).toBeInTheDocument(); // 2 SKUs
      expect(await screen.findByText('22')).toBeInTheDocument(); // 22 units
      expect(await screen.findByText('Cảnh Báo Hàng Sắp Hết')).toBeInTheDocument();

      // Verify Low Stock Table
      expect(await screen.findByText('Màn hình OLED iPhone 15')).toBeInTheDocument();
      expect(await screen.findByText('2 chiếc')).toBeInTheDocument();

      // Verify PO Table
      expect(await screen.findByText('PO-2026-001')).toBeInTheDocument();
      expect(await screen.findByText('Apple Authorized Distributor VN')).toBeInTheDocument();
      expect(await screen.findByText('Chờ nhận hàng')).toBeInTheDocument();
    });
  });
});
