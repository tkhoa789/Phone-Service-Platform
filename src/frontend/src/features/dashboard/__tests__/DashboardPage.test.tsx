import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '../pages/DashboardPage';

// Mock auth store
const mockAuthStore = vi.fn();
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => mockAuthStore(),
}));

// Mock branch store
vi.mock('../../../stores/branchStore', () => ({
  useBranchStore: () => ({
    activeBranchId: 'all',
    activeBranchName: 'Tất cả chi nhánh',
  }),
}));

// Mock theme store
vi.mock('../../../stores/themeStore', () => ({
  useThemeStore: () => ({
    language: 'vi',
  }),
}));

// Mock dashboard hooks
const mockUseDashboardStats = vi.fn();
const mockUseDashboardSupplierDebt = vi.fn();
vi.mock('../hooks/useDashboard', () => ({
  useDashboardStats: (...args: any[]) => mockUseDashboardStats(...args),
  useDashboardSupplierDebt: (...args: any[]) => mockUseDashboardSupplierDebt(...args),
}));

// Mock operational services
vi.mock('../../../services/salesService', () => ({
  salesService: {
    getOrders: vi.fn().mockResolvedValue([]),
    getOrderById: vi.fn(),
  },
}));

vi.mock('../../../services/serviceService', () => ({
  serviceService: {
    getRepairs: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    getWarranties: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    checkWarrantyStatus: vi.fn().mockResolvedValue({ isUnderWarranty: true, imei: '123' }),
  },
}));

vi.mock('../../inventory/services/inventory.service', () => ({
  inventoryService: {
    getInventory: vi.fn().mockResolvedValue([]),
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../purchase-orders/api/purchaseOrdersApi', () => ({
  getPurchaseOrders: vi.fn().mockResolvedValue([]),
}));

const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderDashboard = () => {
  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('DashboardPage — RBAC-05 Role-Aware Dashboard & Safe KPI Composition', () => {
  const mockStatsData = {
    totalRevenue: 1055130000,
    totalProfit: 288130000,
    unitsSold: 70,
    openRepairs: 40,
    openWarranties: 1,
    branchRevenue: [
      {
        branchId: '00000000-0000-0000-0000-000000000001',
        branchName: 'Chi nhánh Quận 1',
        revenue: 1043330000,
      },
    ],
    thirtyDaysRevenue: [
      { date: '2026-09-03T00:00:00Z', revenue: 519180000 },
      { date: '2026-09-04T00:00:00Z', revenue: 524150000 },
    ],
    topProducts: [
      {
        productVariantId: 'p1',
        productName: 'Galaxy S24 Ultra Master',
        sku: 'SKU_S24',
        quantitySold: 39,
        revenue: 975000000,
      },
    ],
    deadStock: [
      {
        productVariantId: 'd1',
        productName: 'Màn hình Samsung S24',
        sku: 'SKU_PART_1',
        quantity: 56,
        lastSoldDate: null,
        warehouseName: 'Kho Master',
        daysSinceLastSale: 999,
      },
    ],
  };

  const mockDebtData = {
    totalDebt: 325000000,
    supplierCount: 23,
    indebtedSuppliersCount: 15,
  };

  beforeEach(() => {
    testQueryClient.clear();
    vi.clearAllMocks();
  });

  it('renders all 6 primary KPI cards with visible profit for Executive Owner / Admin', () => {
    mockAuthStore.mockReturnValue({
      user: { fullName: 'Admin User', email: 'admin@psp.vn' },
      roles: ['Admin'],
    });

    mockUseDashboardStats.mockReturnValue({
      data: mockStatsData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseDashboardSupplierDebt.mockReturnValue({
      data: mockDebtData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderDashboard();

    // Verify Title & Branch context
    expect(screen.getByText('Trung tâm Điều hành Doanh nghiệp')).toBeInTheDocument();
    expect(screen.getByText('Tất cả chi nhánh')).toBeInTheDocument();
    expect(screen.getByText('Quản Trị Hệ Thống (Admin)')).toBeInTheDocument();

    // Verify 6 KPI Card Labels
    expect(screen.getByText('Tổng Doanh Thu')).toBeInTheDocument();
    expect(screen.getByText('Lợi Nhuận Gộp')).toBeInTheDocument();
    expect(screen.getByText('Sản Phẩm Đã Bán')).toBeInTheDocument();
    expect(screen.getByText('Dịch Vụ Đang Sửa Chữa')).toBeInTheDocument();
    expect(screen.getByText('Yêu Cầu Bảo Hành')).toBeInTheDocument();
    expect(screen.getByText('Công Nợ Nhà Cung Cấp')).toBeInTheDocument();

    // Verify real values
    expect(screen.getByText('1.055.130.000 ₫')).toBeInTheDocument();
    expect(screen.getByText('288.130.000 ₫')).toBeInTheDocument();
    expect(screen.getByText('70 sản phẩm')).toBeInTheDocument();
    expect(screen.getByText('40 ca')).toBeInTheDocument();
    expect(screen.getByText('1 trường hợp')).toBeInTheDocument();
    expect(screen.getByText('325.000.000 ₫')).toBeInTheDocument();

    // Verify derived gross margin: 288130000 / 1055130000 = 27.3%
    expect(screen.getByText(/27.3%/)).toBeInTheDocument();
  });

  it('renders Enterprise Restricted badge for Manager when totalProfit is null (RBAC-04 field visibility)', () => {
    mockAuthStore.mockReturnValue({
      user: { fullName: 'Branch Manager', email: 'manager@psp.vn' },
      roles: ['Manager'],
    });

    // Manager gets null totalProfit from server-side RBAC-04 masking
    mockUseDashboardStats.mockReturnValue({
      data: {
        ...mockStatsData,
        totalProfit: null,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseDashboardSupplierDebt.mockReturnValue({
      data: mockDebtData,
      isLoading: false,
      refetch: vi.fn(),
    });

    renderDashboard();

    // Verify manager role badge
    expect(screen.getByText('Quản Lý Chi Nhánh (Manager)')).toBeInTheDocument();

    // Total Revenue is visible
    expect(screen.getByText('Tổng Doanh Thu')).toBeInTheDocument();
    expect(screen.getByText('1.055.130.000 ₫')).toBeInTheDocument();

    // Gross profit is NOT displayed as 0 ₫ or a number, but as restricted badge
    expect(screen.getByText('Bảo mật cấp Doanh nghiệp')).toBeInTheDocument();
    expect(screen.getByText('Chỉ số lợi nhuận giới hạn cấp điều hành công ty')).toBeInTheDocument();
    expect(screen.getByText('RBAC-04')).toBeInTheDocument();
  });

  it('renders 30-Day trend chart, branch breakdown, top products, and dead stock for Executives', () => {
    mockAuthStore.mockReturnValue({
      user: { fullName: 'Admin User', email: 'admin@psp.vn' },
      roles: ['Admin'],
    });

    mockUseDashboardStats.mockReturnValue({
      data: mockStatsData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseDashboardSupplierDebt.mockReturnValue({
      data: mockDebtData,
      isLoading: false,
      refetch: vi.fn(),
    });

    renderDashboard();

    expect(screen.getByText('Biểu Đồ Doanh Thu 30 Ngày Gần Nhất')).toBeInTheDocument();
    expect(screen.getByText('Doanh Thu Theo Chi Nhánh')).toBeInTheDocument();
    expect(screen.getByText('Top 5 Sản Phẩm Bán Chạy Nhất')).toBeInTheDocument();
    expect(screen.getByText('Cảnh Báo Hàng Tồn Đọng Chậm Bán')).toBeInTheDocument();

    // Verify items in top products and dead stock
    expect(screen.getByText('Galaxy S24 Ultra Master')).toBeInTheDocument();
    expect(screen.getByText('Màn hình Samsung S24')).toBeInTheDocument();
  });

  it('renders role-aware non-executive workspace for Sales (no financial KPIs)', () => {
    mockAuthStore.mockReturnValue({
      user: { fullName: 'Sales Staff', email: 'sales@psp.vn' },
      roles: ['Sales'],
    });

    mockUseDashboardStats.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseDashboardSupplierDebt.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: vi.fn(),
    });

    renderDashboard();

    // Financial KPIs should NOT be displayed
    expect(screen.queryByText('Tổng Doanh Thu')).not.toBeInTheDocument();
    expect(screen.queryByText('Lợi Nhuận Gộp')).not.toBeInTheDocument();

    // Sales Workspace components
    expect(screen.getByText('Bàn Làm Việc Bán Hàng & Thu Ngân')).toBeInTheDocument();
    expect(screen.getAllByText('Mở Màn Hình POS').length).toBeGreaterThan(0);
    expect(screen.getByText('Đơn Hàng & Hóa Đơn')).toBeInTheDocument();
    expect(screen.getByText('Bảng Giá & Sản Phẩm')).toBeInTheDocument();
    expect(screen.getByText('Hồ Sơ Khách Hàng')).toBeInTheDocument();
    expect(screen.getByText('Mã Giảm Giá & Voucher')).toBeInTheDocument();
    expect(screen.getByText('Chuyên Viên Bán Hàng (Sales)')).toBeInTheDocument();
  });

  it('renders role-aware non-executive workspace for Technician (no financial KPIs)', () => {
    mockAuthStore.mockReturnValue({
      user: { fullName: 'Tech Staff', email: 'tech@psp.vn' },
      roles: ['Technician'],
    });

    mockUseDashboardStats.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseDashboardSupplierDebt.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: vi.fn(),
    });

    renderDashboard();

    // Financial KPIs should NOT be displayed
    expect(screen.queryByText('Tổng Doanh Thu')).not.toBeInTheDocument();
    expect(screen.queryByText('Lợi Nhuận Gộp')).not.toBeInTheDocument();

    // Technician Workspace components
    expect(screen.getByText('Không Gian Kỹ Thuật Viên Sửa Chữa')).toBeInTheDocument();
    expect(screen.getAllByText('Bàn Sửa Chữa Tiếp Nhận').length).toBeGreaterThan(0);
    expect(screen.getByText('Linh Kiện & Phụ Tùng Thay Thế')).toBeInTheDocument();
    expect(screen.getByText('Lịch Sử Sửa Chữa & Bảo Hành')).toBeInTheDocument();
    expect(screen.getByText('Liên Hệ Khách Hàng Chủ Máy')).toBeInTheDocument();
    expect(screen.getByText('Kỹ Thuật Viên Sửa Chữa (Technician)')).toBeInTheDocument();
  });

  it('renders role-aware non-executive workspace for Warranty (no financial KPIs)', () => {
    mockAuthStore.mockReturnValue({
      user: { fullName: 'Warranty Specialist', email: 'warranty@psp.vn' },
      roles: ['Warranty'],
    });

    mockUseDashboardStats.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseDashboardSupplierDebt.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: vi.fn(),
    });

    renderDashboard();

    // Financial KPIs should NOT be displayed
    expect(screen.queryByText('Tổng Doanh Thu')).not.toBeInTheDocument();
    expect(screen.queryByText('Lợi Nhuận Gộp')).not.toBeInTheDocument();

    // Warranty Workspace components
    expect(screen.getByText('Trung Tâm Tiếp Nhận & Xử Lý Bảo Hành')).toBeInTheDocument();
    expect(screen.getAllByText('Quản Lý Hồ Sơ Bảo Hành').length).toBeGreaterThan(0);
    expect(screen.getByText('Tra Cứu Lịch Sử Serial / IMEI')).toBeInTheDocument();
    expect(screen.getByText('Đối Chiếu Hóa Đơn Gốc')).toBeInTheDocument();
    expect(screen.getByText('Hồ Sơ Khách Hàng Bảo Hành')).toBeInTheDocument();
    expect(screen.getByText('Chuyên Viên Bảo Hành (Warranty)')).toBeInTheDocument();
  });

  it('renders role-aware non-executive workspace for Inventory (no financial KPIs)', () => {
    mockAuthStore.mockReturnValue({
      user: { fullName: 'Inventory Specialist', email: 'inventory@psp.vn' },
      roles: ['Inventory'],
    });

    mockUseDashboardStats.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseDashboardSupplierDebt.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: vi.fn(),
    });

    renderDashboard();

    // Financial KPIs should NOT be displayed
    expect(screen.queryByText('Tổng Doanh Thu')).not.toBeInTheDocument();
    expect(screen.queryByText('Lợi Nhuận Gộp')).not.toBeInTheDocument();

    // Inventory Workspace components
    expect(screen.getByText('Trung Tâm Quản Lý Kho Bãi & Cung Ứng')).toBeInTheDocument();
    expect(screen.getByText('Tồn Kho & Quản Lý IMEI')).toBeInTheDocument();
    expect(screen.getByText('Đợt Kiểm Kê Kho Hàng')).toBeInTheDocument();
    expect(screen.getByText('Đơn Nhập Hàng & Mua Hàng')).toBeInTheDocument();
    expect(screen.getByText('Danh Bạ Nhà Cung Cấp')).toBeInTheDocument();
    expect(screen.getByText('Quản Lý Kho & Cung Ứng (Inventory)')).toBeInTheDocument();
  });

  it('renders loading skeletons without crashing when data is loading', () => {
    mockAuthStore.mockReturnValue({
      user: { fullName: 'Admin User', email: 'admin@psp.vn' },
      roles: ['Admin'],
    });

    mockUseDashboardStats.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseDashboardSupplierDebt.mockReturnValue({
      data: null,
      isLoading: true,
      refetch: vi.fn(),
    });

    const { container } = renderDashboard();

    // Skeletons should be rendered
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error notification and retry button when stats query fails', () => {
    const mockRefetch = vi.fn();
    mockAuthStore.mockReturnValue({
      user: { fullName: 'Admin User', email: 'admin@psp.vn' },
      roles: ['Admin'],
    });

    mockUseDashboardStats.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    mockUseDashboardSupplierDebt.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: vi.fn(),
    });

    renderDashboard();

    expect(screen.getByText(/Không thể tải số liệu thống kê từ máy chủ/)).toBeInTheDocument();
    const retryBtn = screen.getByText('Thử lại');
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders ExecutiveDashboard for Owner with visible profit and executive badges', () => {
    mockAuthStore.mockReturnValue({
      user: { fullName: 'Owner Master', email: 'owner@psp.vn' },
      roles: ['Owner'],
    });

    mockUseDashboardStats.mockReturnValue({
      data: mockStatsData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseDashboardSupplierDebt.mockReturnValue({
      data: mockDebtData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderDashboard();

    expect(screen.getByText('Trung tâm Điều hành Doanh nghiệp')).toBeInTheDocument();
    expect(screen.getByText('Quản Trị Cấp Cao (Owner)')).toBeInTheDocument();
    expect(screen.getByText('Tổng Doanh Thu')).toBeInTheDocument();
    expect(screen.getByText('Lợi Nhuận Gộp')).toBeInTheDocument();
    expect(screen.getByText('288.130.000 ₫')).toBeInTheDocument();
  });
});
