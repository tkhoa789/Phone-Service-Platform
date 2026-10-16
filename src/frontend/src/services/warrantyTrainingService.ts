import type { IWarrantyService } from './IWarrantyService';
import type {
  WarrantyTicketDto,
  CreateWarrantyTicketCommand,
  WarrantyCheckResultDto,
  RejectWarrantyCommand,
  TransferToInHouseRepairCommand,
  ReplaceDeviceCommand,
  SendToVendorCommand,
  DeliverToCustomerCommand
} from '../types/api.types';

const simulateDelay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

const createInitialTickets = (): WarrantyTicketDto[] => [
  {
    id: 'demo-war-01',
    code: 'WAR-DEMO-01',
    ticketCode: 'WAR-DEMO-01',
    status: 'Received',
    imei: '356891092837461',
    customerId: 'cust-demo-01',
    customerName: 'Trần Văn Hưng (Học viên Demo)',
    customerPhone: '0912345678',
    productVariantId: 'pv-demo-01',
    productName: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
    productSku: 'IPHONE15PM-256-NAT',
    issueDescription: 'Máy không lên nguồn sau khi sạc qua đêm, không dấu hiệu cấn móp va đập. [Kịch bản 1: Sửa chữa nội bộ 0đ]',
    note: 'Thẩm định: Chuyển KTV chuyên sâu kiểm tra IC nguồn / sạc nhanh.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    rowVersion: 'AAAAAAABAAA=',
    histories: [
      {
        id: 'hist-demo-01-1',
        warrantyTicketId: 'demo-war-01',
        action: 'Tiếp nhận bảo hành',
        status: 'Received',
        description: 'Tiếp nhận thiết bị tại quầy dịch vụ thực hành Sandbox',
        actorName: 'KTV Thực hành Demo',
        createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      }
    ]
  },
  {
    id: 'demo-war-02',
    code: 'WAR-DEMO-02',
    ticketCode: 'WAR-DEMO-02',
    status: 'Received',
    imei: '354892019283745',
    customerId: 'cust-demo-02',
    customerName: 'Lê Thị Mai (Học viên Demo)',
    customerPhone: '0987654321',
    productVariantId: 'pv-demo-02',
    productName: 'Samsung Galaxy S24 Ultra 512GB Xám Titan',
    productSku: 'S24U-512-TI',
    issueDescription: 'Màn hình nhấp nháy, kiểm tra quỳ tím khay SIM đã đổi màu đỏ đậm. [Kịch bản 2: Từ chối bảo hành & Báo giá sửa dịch vụ]',
    note: 'Thẩm định: Từ chối bảo hành do vào nước (Water Damage), đề xuất chuyển sửa chữa dịch vụ có tính phí.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    rowVersion: 'AAAAAAABAAE=',
    histories: [
      {
        id: 'hist-demo-02-1',
        warrantyTicketId: 'demo-war-02',
        action: 'Tiếp nhận bảo hành',
        status: 'Received',
        description: 'Khách hàng mang máy tới báo lỗi màn hình',
        actorName: 'KTV Thực hành Demo',
        createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      }
    ]
  },
  {
    id: 'demo-war-03',
    code: 'WAR-DEMO-03',
    ticketCode: 'WAR-DEMO-03',
    status: 'Received',
    imei: '359812345678901',
    customerId: 'cust-demo-03',
    customerName: 'Nguyễn Hoàng Long (Học viên Demo)',
    customerPhone: '0903123456',
    productVariantId: 'pv-demo-03',
    productName: 'iPad Pro M4 11 inch 256GB Space Black',
    productSku: 'IPAD-M4-11-256',
    issueDescription: 'Máy mua 12 ngày (trong cửa sổ vàng 30 ngày BR-905), sọc xanh dọc màn hình. [Kịch bản 3: Đổi máy 1-1 BR-905]',
    note: 'Thẩm định: Đạt điều kiện chính sách BR-905 đổi mới 1-1, xuất máy mới từ kho.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    rowVersion: 'AAAAAAABAAI=',
    histories: [
      {
        id: 'hist-demo-03-1',
        warrantyTicketId: 'demo-war-03',
        action: 'Tiếp nhận bảo hành',
        status: 'Received',
        description: 'Kiểm tra ngày kích hoạt: Còn 18 ngày trong cửa sổ BR-905',
        actorName: 'KTV Thực hành Demo',
        createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      }
    ]
  },
  {
    id: 'demo-war-04',
    code: 'WAR-DEMO-04',
    ticketCode: 'WAR-DEMO-04',
    status: 'Received',
    imei: 'C02FJ1ABMD6M',
    customerId: 'cust-demo-04',
    customerName: 'Phạm Đăng Khoa (Học viên Demo)',
    customerPhone: '0938889900',
    productVariantId: 'pv-demo-04',
    productName: 'MacBook Pro 14 M3 Pro 18GB/512GB Silver',
    productSku: 'MBP14-M3-SIL',
    issueDescription: 'Lỗi chip bảo mật Apple T2 / Secure Enclave, cần máy chẩn đoán chuyên dụng của hãng. [Kịch bản 4: Chuyển TTBH Apple AASP]',
    note: 'Thẩm định: Chuyển trung tâm ủy quyền Apple AASP (Thakral One / FPT Services).',
    createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    rowVersion: 'AAAAAAABAAM=',
    histories: [
      {
        id: 'hist-demo-04-1',
        warrantyTicketId: 'demo-war-04',
        action: 'Tiếp nhận bảo hành',
        status: 'Received',
        description: 'Máy nguyên ốc chưa bung mở, lỗi yêu cầu công cụ hãng OEM',
        actorName: 'KTV Thực hành Demo',
        createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      }
    ]
  },
  {
    id: 'demo-war-05',
    code: 'WAR-DEMO-05',
    ticketCode: 'WAR-DEMO-05',
    status: 'Processing',
    imei: '867492049182374',
    customerId: 'cust-demo-05',
    customerName: 'Đỗ Thu Hằng (Học viên Demo)',
    customerPhone: '0977112233',
    productVariantId: 'pv-demo-05',
    productName: 'Xiaomi 14 Ultra 512GB Black',
    productSku: 'MI14U-512-BLK',
    issueDescription: 'Đã hoàn tất thay thế cụm camera Leica và chạy test 18 hạng mục kỹ thuật chuẩn. [Kịch bản 5: Bàn giao máy trả khách]',
    note: 'Máy đã test pass OK 100%, sẵn sàng bàn giao tại quầy trả máy.',
    repairTicketCode: 'REP-DEMO-999',
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    rowVersion: 'AAAAAAABAAQ=',
    histories: [
      {
        id: 'hist-demo-05-1',
        warrantyTicketId: 'demo-war-05',
        action: 'Tiếp nhận bảo hành',
        status: 'Received',
        description: 'Tiếp nhận máy rung lắc cụm cảm biến OIS',
        actorName: 'KTV Thực hành Demo',
        createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      },
      {
        id: 'hist-demo-05-2',
        warrantyTicketId: 'demo-war-05',
        action: 'Chuyển sửa chữa nội bộ',
        status: 'Processing',
        description: 'Đã liên kết phiếu sửa chữa REP-DEMO-999 với định mức chi phí 0đ',
        actorName: 'KTV Nguyễn Văn An',
        createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
      },
      {
        id: 'hist-demo-05-3',
        warrantyTicketId: 'demo-war-05',
        action: 'Kỹ thuật hoàn thành sửa chữa',
        status: 'Processing',
        description: 'KTV đã hoàn tất căn chỉnh ống kính camera, test chụp 4K sắc nét',
        actorName: 'KTV Nguyễn Văn An',
        createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      }
    ]
  },
  {
    id: 'demo-war-06',
    code: 'WAR-DEMO-06',
    ticketCode: 'WAR-DEMO-06',
    status: 'Processing',
    imei: '358912093847562',
    customerId: 'cust-demo-06',
    customerName: 'Hoàng Minh Tuấn (Học viên Demo)',
    customerPhone: '0966554433',
    productVariantId: 'pv-demo-06',
    productName: 'Samsung Galaxy Z Fold 5 512GB Icy Blue',
    productSku: 'ZFOLD5-512-BLU',
    issueDescription: 'Lỗi cáp gập màn hình chính, đã gửi TTBH Samsung Care. [Kịch bản 6: Nhận máy RMA hãng quay về chi nhánh trả khách]',
    note: 'Đã gửi Samsung Care Hải Triều. Mã RMA: SS-CARE-2609',
    vendorName: 'Samsung Care+ (Hải Triều)',
    vendorTicketNumber: 'SS-CARE-2609',
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    rowVersion: 'AAAAAAABAAU=',
    histories: [
      {
        id: 'hist-demo-06-1',
        warrantyTicketId: 'demo-war-06',
        action: 'Tiếp nhận bảo hành',
        status: 'Received',
        description: 'Tiếp nhận máy gập Z Fold 5 lỗi cáp màn hình trong',
        actorName: 'KTV Thực hành Demo',
        createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
      },
      {
        id: 'hist-demo-06-2',
        warrantyTicketId: 'demo-war-06',
        action: 'Chuyển TTBH Hãng (OEM RMA)',
        status: 'Processing',
        description: 'Chuyển máy sang TTBH Samsung Care+ Hải Triều. Mã RMA: SS-CARE-2609',
        actorName: 'KTV Thực hành Demo',
        createdAt: new Date(Date.now() - 3600 * 1000 * 36).toISOString(),
      }
    ]
  }
];

const SANDBOX_WARRANTIES_STORAGE_KEY = 'psp_sandbox_warranties';

export class WarrantyTrainingService implements IWarrantyService {
  private tickets: WarrantyTicketDto[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(SANDBOX_WARRANTIES_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.tickets = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('[Sandbox] Failed to load sandbox warranties from storage', e);
    }
    this.reset();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(SANDBOX_WARRANTIES_STORAGE_KEY, JSON.stringify(this.tickets));
    } catch (e) {
      console.warn('[Sandbox] Failed to save sandbox warranties to storage', e);
    }
  }

  public reset(): void {
    this.tickets = createInitialTickets();
    this.saveToStorage();
  }

  async getWarranties(params?: { pageIndex?: number; pageSize?: number; search?: string }): Promise<{ items: WarrantyTicketDto[]; totalCount: number }> {
    await simulateDelay(150);
    let result = [...this.tickets];
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.code?.toLowerCase().includes(q) ||
          t.ticketCode?.toLowerCase().includes(q) ||
          t.imei?.toLowerCase().includes(q) ||
          t.customerName?.toLowerCase().includes(q) ||
          t.productName?.toLowerCase().includes(q)
      );
    }
    return {
      items: result,
      totalCount: result.length,
    };
  }

  async getWarrantyById(id: string): Promise<WarrantyTicketDto> {
    await simulateDelay(100);
    const ticket = this.tickets.find((t) => t.id === id);
    if (!ticket) {
      throw new Error(`[Sandbox] Không tìm thấy phiếu bảo hành demo ID: ${id}`);
    }
    return JSON.parse(JSON.stringify(ticket));
  }

  async checkWarrantyStatus(imei: string): Promise<WarrantyCheckResultDto> {
    await simulateDelay(200);
    return {
      imei,
      isUnderWarranty: true,
      warrantyStatus: 'Active',
      productVariantId: 'pv-demo-created',
      productName: 'iPhone 15 Pro Max (Sandbox Demo)',
      productSku: 'IPHONE15PM-256-NAT',
      currentImeiStatus: 'Sold',
      customerId: 'cust-demo-search',
      customerName: 'Học viên Huấn luyện',
      warrantyExpirationDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
      purchaseDate: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
      remainingDays: 180,
    };
  }

  async createWarrantyTicket(command: CreateWarrantyTicketCommand): Promise<string> {
    await simulateDelay(300);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `demo-war-created-${randomSuffix}`;
    const newCode = `WAR-DEMO-${randomSuffix}`;

    const newTicket: WarrantyTicketDto = {
      id: newId,
      code: newCode,
      ticketCode: newCode,
      status: 'Received',
      imei: command.imei,
      customerId: command.customerId || 'cust-demo-user',
      customerName: 'Học viên Huấn luyện',
      customerPhone: '0988888888',
      productVariantId: command.productVariantId || 'pv-demo-created',
      productName: 'Thiết bị thực hành Sandbox',
      productSku: 'SKU-SANDBOX-DEMO',
      issueDescription: command.note || 'Yêu cầu thẩm định bảo hành',
      note: command.note,
      createdAt: new Date().toISOString(),
      rowVersion: 'AAAAAAABAAA=',
      histories: [
        {
          id: `hist-${randomSuffix}-1`,
          warrantyTicketId: newId,
          action: 'Tiếp nhận bảo hành',
          status: 'Received',
          description: `Tiếp nhận tại quầy thực hành Sandbox. Ghi chú: ${command.note || 'N/A'}`,
          actorName: 'KTV Thực hành Demo',
          createdAt: new Date().toISOString(),
        }
      ]
    };

    this.tickets.unshift(newTicket);
    this.saveToStorage();
    return newId;
  }

  async updateWarrantyStatus(
    id: string,
    status: string,
    action: string,
    description: string | null,
    newImei: string | null,
    _rowVersion: string
  ): Promise<boolean> {
    await simulateDelay(200);
    const ticket = this.tickets.find((t) => t.id === id);
    if (!ticket) return false;

    ticket.status = status as any;
    ticket.rowVersion = `UPD-${Date.now()}`;
    if (newImei) ticket.note = `${ticket.note || ''} | IMEI mới: ${newImei}`;

    if (!ticket.histories) ticket.histories = [];
    ticket.histories.push({
      id: `hist-upd-${Date.now()}`,
      warrantyTicketId: id,
      action,
      status,
      description: description || 'Cập nhật trạng thái phiếu bảo hành',
      actorName: 'KTV Thực hành Demo',
      createdAt: new Date().toISOString(),
    });

    this.saveToStorage();
    return true;
  }

  async deleteWarrantyTicket(id: string): Promise<boolean> {
    await simulateDelay(150);
    this.tickets = this.tickets.filter((t) => t.id !== id);
    this.saveToStorage();
    return true;
  }

  async rejectWarranty(command: RejectWarrantyCommand): Promise<boolean> {
    await simulateDelay(300);
    const ticket = this.tickets.find((t) => t.id === command.warrantyTicketId);
    if (!ticket) throw new Error('[Sandbox] Không tìm thấy phiếu mẫu cần từ chối');

    ticket.status = 'Rejected';
    ticket.rowVersion = `UPD-${Date.now()}`;
    const desc = `Lý do: ${command.reason}. Ghi chú: ${command.rejectNotes}${
      command.transferToPaidRepair ? ' (Hệ thống tự động chuyển sang luồng Sửa chữa dịch vụ có phí)' : ''
    }`;

    if (!ticket.histories) ticket.histories = [];
    ticket.histories.push({
      id: `hist-rej-${Date.now()}`,
      warrantyTicketId: ticket.id,
      action: 'Từ chối bảo hành',
      status: 'Rejected',
      description: desc,
      actorName: 'KTV Thực hành Demo',
      createdAt: new Date().toISOString(),
    });

    this.saveToStorage();
    return true;
  }

  async transferToInHouseRepair(command: TransferToInHouseRepairCommand): Promise<string> {
    await simulateDelay(300);
    const ticket = this.tickets.find((t) => t.id === command.warrantyTicketId);
    if (!ticket) throw new Error('[Sandbox] Không tìm thấy phiếu mẫu cần chuyển sửa');

    const repTicketCode = `REP-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
    ticket.status = 'Processing';
    ticket.repairTicketCode = repTicketCode;
    ticket.rowVersion = `UPD-${Date.now()}`;

    if (!ticket.histories) ticket.histories = [];
    ticket.histories.push({
      id: `hist-rep-${Date.now()}`,
      warrantyTicketId: ticket.id,
      action: 'Chuyển sửa chữa nội bộ',
      status: 'Processing',
      description: `Đã tạo phiếu sửa chữa ${repTicketCode} (Chi phí 0đ theo chuẩn bảo hành). Chẩn đoán linh kiện: ${command.componentDiagnosis}`,
      actorName: 'KTV Thực hành Demo',
      createdAt: new Date().toISOString(),
    });

    this.saveToStorage();
    return repTicketCode;
  }

  async replaceWarrantyDevice(command: ReplaceDeviceCommand): Promise<boolean> {
    await simulateDelay(300);
    const ticket = this.tickets.find((t) => t.id === command.warrantyTicketId);
    if (!ticket) throw new Error('[Sandbox] Không tìm thấy phiếu mẫu cần đổi máy');

    ticket.status = 'Processing';
    ticket.rowVersion = `UPD-${Date.now()}`;
    ticket.note = `${ticket.note || ''} | Đổi máy mới 1-1 BR-905 (IMEI mới: ${command.newImei})`;

    if (!ticket.histories) ticket.histories = [];
    ticket.histories.push({
      id: `hist-swap-${Date.now()}`,
      warrantyTicketId: ticket.id,
      action: 'Đổi thiết bị mới 1-1 (BR-905)',
      status: 'Processing',
      description: `Đã hoàn tất thủ tục xuất đổi thiết bị mới nguyên seal (IMEI mới: ${command.newImei}). Lý do: ${command.reason || 'Lỗi nghiêm trọng trong cửa sổ 30 ngày'}`,
      actorName: 'KTV Thực hành Demo',
      createdAt: new Date().toISOString(),
    });

    this.saveToStorage();
    return true;
  }

  async sendWarrantyToVendor(command: SendToVendorCommand): Promise<boolean> {
    await simulateDelay(300);
    const ticket = this.tickets.find((t) => t.id === command.warrantyTicketId);
    if (!ticket) throw new Error('[Sandbox] Không tìm thấy phiếu mẫu cần gửi hãng');

    ticket.status = 'Processing';
    ticket.vendorName = command.vendorName;
    ticket.vendorTicketNumber = command.vendorTicketNumber;
    ticket.rowVersion = `UPD-${Date.now()}`;

    if (!ticket.histories) ticket.histories = [];
    ticket.histories.push({
      id: `hist-rma-${Date.now()}`,
      warrantyTicketId: ticket.id,
      action: 'Chuyển TTBH Hãng (OEM RMA)',
      status: 'Processing',
      description: `Gửi máy sang trung tâm bảo hành hãng ${command.vendorName}. Mã tiếp nhận hãng: ${command.vendorTicketNumber}. Vận đơn: ${command.trackingNumber}`,
      actorName: 'KTV Thực hành Demo',
      createdAt: new Date().toISOString(),
    });

    this.saveToStorage();
    return true;
  }

  async deliverWarrantyToCustomer(command: DeliverToCustomerCommand): Promise<boolean> {
    await simulateDelay(300);
    const ticket = this.tickets.find((t) => t.id === command.warrantyTicketId);
    if (!ticket) throw new Error('[Sandbox] Không tìm thấy phiếu mẫu cần bàn giao');

    ticket.status = 'Completed';
    ticket.endDate = new Date().toISOString();
    ticket.rowVersion = `UPD-${Date.now()}`;

    if (!ticket.histories) ticket.histories = [];
    ticket.histories.push({
      id: `hist-del-${Date.now()}`,
      warrantyTicketId: ticket.id,
      action: 'Bàn giao trả khách hàng',
      status: 'Completed',
      description: `Đã bàn giao thiết bị hoàn tất cho khách: ${command.receiverName || ticket.customerName}. Ghi chú bàn giao: ${command.notes || 'Khách đã nghiệm thu và nhận máy'}`,
      actorName: 'KTV Thực hành Demo',
      createdAt: new Date().toISOString(),
    });

    this.saveToStorage();
    return true;
  }
}

export const warrantyTrainingService = new WarrantyTrainingService();
