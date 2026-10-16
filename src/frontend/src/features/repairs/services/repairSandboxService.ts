import type { 
  RepairTicketDto, 
  RepairTicketStatus, 
  RepairPartDto, 
  RepairChecklistDto,
  RepairQueueStatsDto
} from '../../../types/api.types';
import { operationalNotificationService } from '../../../services/operationalNotificationService';

const SANDBOX_REPAIRS_STORAGE_KEY = 'psp_sandbox_repairs';

const createInitialSandboxRepairs = (): RepairTicketDto[] => [
  {
    id: 'demo-rep-01',
    code: 'REP-DEMO-01',
    ticketCode: 'REP-DEMO-01',
    customerId: 'cust-demo-01',
    customerName: 'Anh Hoàng Nam (Học viên Demo)',
    customerPhone: '0909123456',
    productVariantId: 'pv-s24u-512',
    productName: 'Samsung Galaxy S24 Ultra 512GB Xám Titan',
    deviceModel: 'Samsung Galaxy S24 Ultra',
    productSku: 'S24U-512-TI',
    imei: '356891092837461',
    receivedById: 'staff-demo-reception',
    receivedByName: 'Lễ Tân Tiếp Nhận',
    technicianId: undefined,
    technicianName: undefined,
    status: 'PendingAssignment',
    problemDescription: 'Màn hình sọc xanh sau va chạm rơi rớt, liệt cảm ứng góc dưới bên phải. [Kịch bản 1: Nhận việc máy mới]',
    exteriorCondition: 'Kính trước nứt nhẹ góc trên, viền trầy dăm, quỳ tím trắng tốt.',
    laborCost: 350000,
    partsTotal: 2150000,
    totalAmount: 2500000,
    receivedDate: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    parts: [],
    statusHistories: [
      {
        id: 'hist-demo-01-1',
        repairTicketId: 'demo-rep-01',
        status: 'PendingAssignment',
        note: 'Tiếp nhận thiết bị tại quầy dịch vụ Sandbox, chuyển hàng đợi phân công thợ.',
        createdBy: 'Lễ Tân Tiếp Nhận',
        createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      }
    ],
    checklists: [
      {
        id: 'chk-demo-01',
        repairTicketId: 'demo-rep-01',
        type: 'CheckIn',
        inspectorId: 'staff-demo-reception',
        inspectorName: 'Lễ Tân Tiếp Nhận',
        inspectedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        notes: 'Kiểm tra ban đầu trước khi nhận máy',
        createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        items: [
          { id: 'item-01', checkPointName: 'Cảm ứng & Hiển thị', isPassed: false, issueDescription: 'Sọc xanh dọc, liệt góc dưới' },
          { id: 'item-02', checkPointName: 'Khởi động & Sạc 45W', isPassed: true },
          { id: 'item-03', checkPointName: 'Camera Trước / Sau', isPassed: true },
        ]
      }
    ],
  },
  {
    id: 'demo-rep-02',
    code: 'REP-DEMO-02',
    ticketCode: 'REP-DEMO-02',
    customerId: 'cust-demo-02',
    customerName: 'Chị Ngọc Hân (Học viên Demo)',
    customerPhone: '0918765432',
    productVariantId: 'pv-ip15pm-256',
    productName: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
    deviceModel: 'iPhone 15 Pro Max',
    productSku: 'IPHONE15PM-256-NAT',
    imei: '354892019283745',
    receivedById: 'staff-demo-reception',
    receivedByName: 'Lễ Tân Tiếp Nhận',
    technicianId: 'demo-tech-current',
    technicianName: 'KTV Thực Hành Demo',
    status: 'Repairing',
    problemDescription: 'Pin chai 62%, pin phồng đội nắp lưng, sạc nhanh máy nóng ran. [Kịch bản 2: Sửa chữa & Nạp linh kiện]',
    exteriorCondition: 'Nắp lưng hở 1.5mm do pin phồng, màn hình nguyên vẹn, không trầy.',
    laborCost: 250000,
    partsTotal: 1000000,
    totalAmount: 1250000,
    receivedDate: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    parts: [
      {
        id: 'part-demo-01',
        repairTicketId: 'demo-rep-02',
        productVariantId: 'pv-demo-bat-15pm',
        productName: 'Pin Pisen iPhone 15 Pro Max 4422mAh (Chính Hãng)',
        productSku: 'BAT-IP15PM-PISEN',
        quantity: 1,
        unitPrice: 1000000,
        totalPrice: 1000000,
        addedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
        addedBy: 'KTV Thực Hành Demo',
      }
    ],
    statusHistories: [
      {
        id: 'hist-demo-02-1',
        repairTicketId: 'demo-rep-02',
        status: 'Diagnosing',
        note: 'KTV nhận máy, tiến hành đo dòng và kiểm tra độ chai cell pin.',
        createdBy: 'KTV Thực Hành Demo',
        createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      },
      {
        id: 'hist-demo-02-2',
        repairTicketId: 'demo-rep-02',
        status: 'Repairing',
        note: 'Xuất kho Pin Pisen, bắt đầu tháo nắp lưng và thay thế.',
        createdBy: 'KTV Thực Hành Demo',
        createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      }
    ],
    checklists: [
      {
        id: 'chk-demo-02',
        repairTicketId: 'demo-rep-02',
        type: 'CheckIn',
        inspectorId: 'staff-demo-reception',
        inspectorName: 'Lễ Tân Tiếp Nhận',
        inspectedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
        notes: 'Kiểm tra pin và FaceID',
        createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
        items: [
          { id: 'item-21', checkPointName: 'Pin & Sạc', isPassed: false, issueDescription: 'Pin phồng, chu kỳ 1120 lần' },
          { id: 'item-22', checkPointName: 'FaceID & TrueTone', isPassed: true },
        ]
      }
    ],
  },
  {
    id: 'demo-rep-03',
    code: 'REP-DEMO-03',
    ticketCode: 'REP-DEMO-03',
    customerId: 'cust-demo-03',
    customerName: 'Anh Tuấn Kiệt (Học viên Demo)',
    customerPhone: '0977889900',
    productVariantId: 'pv-mi14u-512',
    productName: 'Xiaomi 14 Ultra Trắng Gốm',
    deviceModel: 'Xiaomi 14 Ultra',
    productSku: 'MI14U-512-WHT',
    imei: '864209123456789',
    receivedById: 'staff-demo-reception',
    receivedByName: 'Lễ Tân Tiếp Nhận',
    technicianId: 'demo-tech-current',
    technicianName: 'KTV Thực Hành Demo',
    status: 'WaitingForParts',
    problemDescription: 'Vỡ cụm kính camera sau tiềm vọng Leica, kẹt thấu kính zoom quang 5x. [Kịch bản 3: Điểm nghẽn thiếu linh kiện]',
    exteriorCondition: 'Kính camera sau nứt vỡ, thân gốm không trầy xước.',
    laborCost: 500000,
    partsTotal: 3300000,
    totalAmount: 3800000,
    receivedDate: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    parts: [],
    statusHistories: [
      {
        id: 'hist-demo-03-1',
        repairTicketId: 'demo-rep-03',
        status: 'WaitingForParts',
        note: 'Kho chi nhánh hết cụm module camera tiềm vọng Leica, tạo phiếu yêu cầu Thủ kho đặt phụ tùng.',
        createdBy: 'KTV Thực Hành Demo',
        createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      }
    ],
  },
  {
    id: 'demo-rep-04',
    code: 'REP-DEMO-04',
    ticketCode: 'REP-DEMO-04',
    customerId: 'cust-demo-04',
    customerName: 'Bác Minh Trí (Học viên Demo)',
    customerPhone: '0933221100',
    productVariantId: 'pv-ipad-m2-128',
    productName: 'iPad Pro M2 11-inch Space Gray',
    deviceModel: 'iPad Pro M2 11-inch',
    productSku: 'IPAD-M2-11-GRY',
    imei: '359981029384756',
    receivedById: 'staff-demo-reception',
    receivedByName: 'Lễ Tân Tiếp Nhận',
    technicianId: 'demo-tech-current',
    technicianName: 'KTV Thực Hành Demo',
    status: 'Completed',
    problemDescription: 'Thay màn hình Liquid Retina và ép lại chân cáp cảm ứng. [Kịch bản 4: Nghiệm thu & Bàn giao]',
    exteriorCondition: 'Đã dán tem bảo hành PSP, màn hình sáng đẹp, cảm ứng đạt 100%.',
    laborCost: 600000,
    partsTotal: 3600000,
    totalAmount: 4200000,
    receivedDate: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    completedDate: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    parts: [
      {
        id: 'part-demo-04',
        repairTicketId: 'demo-rep-04',
        productVariantId: 'pv-screen-ipad-m2',
        productName: 'Màn hình Liquid Retina iPad Pro 11 M2 Zin',
        productSku: 'SCR-IPAD-M2-11',
        quantity: 1,
        unitPrice: 3600000,
        totalPrice: 3600000,
        addedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        addedBy: 'KTV Thực Hành Demo',
      }
    ],
    statusHistories: [
      {
        id: 'hist-demo-04-1',
        repairTicketId: 'demo-rep-04',
        status: 'WaitingQC',
        note: 'Thay thế màn hình và ráp hoàn chỉnh, chuyển bàn QC test.',
        createdBy: 'KTV Thực Hành Demo',
        createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      },
      {
        id: 'hist-demo-04-2',
        repairTicketId: 'demo-rep-04',
        status: 'Completed',
        note: 'QC đạt chuẩn 10/10 tiêu chí. Dán tem bảo hành, cất tủ chờ khách lấy.',
        createdBy: 'KTV QC Trưởng',
        createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      }
    ],
  }
];

export interface SandboxRepairQueryOptions {
  search?: string;
  status?: string;
  queue?: string;
  technicianId?: string;
}

export const repairSandboxService = {
  getRepairs: (options?: SandboxRepairQueryOptions | string): RepairTicketDto[] => {
    const opts: SandboxRepairQueryOptions = typeof options === 'string' 
      ? { technicianId: options } 
      : (options || {});
    const currentUserId = opts.technicianId;

    let list: RepairTicketDto[] = [];
    try {
      const stored = localStorage.getItem(SANDBOX_REPAIRS_STORAGE_KEY);
      if (!stored) {
        list = createInitialSandboxRepairs();
        if (currentUserId) {
          list.forEach(t => {
            if (t.technicianId === 'demo-tech-current') {
              t.technicianId = currentUserId;
            }
          });
        }
        localStorage.setItem(SANDBOX_REPAIRS_STORAGE_KEY, JSON.stringify(list));
      } else {
        list = JSON.parse(stored);
        if (currentUserId) {
          list.forEach(t => {
            if (t.technicianId === 'demo-tech-current') {
              t.technicianId = currentUserId;
            }
          });
        }
      }
    } catch {
      list = createInitialSandboxRepairs();
    }

    if (opts.search) {
      const q = opts.search.toLowerCase();
      list = list.filter(t => 
        (t.ticketCode || t.code || '').toLowerCase().includes(q) ||
        (t.customerName || '').toLowerCase().includes(q) ||
        (t.customerPhone || '').includes(q) ||
        (t.imei || '').toLowerCase().includes(q) ||
        (t.productName || t.deviceModel || '').toLowerCase().includes(q)
      );
    }

    if (opts.status && opts.status !== 'ALL') {
      list = list.filter(t => t.status === opts.status);
    }

    if (opts.queue && opts.queue !== 'ALL') {
      const isMine = (t: RepairTicketDto) => Boolean(
        t.technicianId && 
        ((currentUserId && t.technicianId.toLowerCase() === currentUserId.toLowerCase()) || t.technicianId === 'demo-tech-current')
      );
      const isUnassigned = (t: RepairTicketDto) => 
        (!t.technicianId || t.technicianId === '00000000-0000-0000-0000-000000000000' || t.status === 'PendingAssignment') && 
        !['Completed', 'Delivered', 'Cancelled'].includes(t.status);

      switch (opts.queue) {
        case 'UNASSIGNED':
          list = list.filter(isUnassigned);
          break;
        case 'MY_TICKETS':
          list = list.filter(t => isMine(t) && !['Delivered', 'Cancelled'].includes(t.status));
          break;
        case 'IN_PROGRESS':
          list = list.filter(t => ['Diagnosing', 'WaitingApproval', 'WaitingForParts', 'Repairing', 'WaitingQC'].includes(t.status));
          break;
        case 'COMPLETED':
          list = list.filter(t => t.status === 'Completed' || t.status === 'WaitingPickup');
          break;
        case 'DELIVERED':
          list = list.filter(t => t.status === 'Delivered');
          break;
      }
    }

    return list;
  },

  getRepairStats: (currentUserId?: string): RepairQueueStatsDto => {
    const list = repairSandboxService.getRepairs(currentUserId);
    const isMine = (t: RepairTicketDto) => Boolean(
      t.technicianId && 
      ((currentUserId && t.technicianId.toLowerCase() === currentUserId.toLowerCase()) || t.technicianId === 'demo-tech-current')
    );
    const isUnassigned = (t: RepairTicketDto) => 
      (!t.technicianId || t.status === 'PendingAssignment') && 
      !['Completed', 'Delivered', 'Cancelled'].includes(t.status);

    const diagnosingCount = list.filter(t => t.status === 'Diagnosing').length;
    const repairingCount = list.filter(t => t.status === 'Repairing').length;
    const inProgressCount = list.filter(t => ['Diagnosing', 'WaitingApproval', 'WaitingForParts', 'Repairing', 'WaitingQC'].includes(t.status)).length;

    return {
      unassignedCount: list.filter(isUnassigned).length,
      myTasksCount: list.filter(t => isMine(t) && t.status !== 'Delivered' && t.status !== 'Cancelled').length,
      waitingForPartsCount: list.filter(t => t.status === 'WaitingForParts').length,
      waitingApprovalCount: list.filter(t => t.status === 'WaitingApproval').length,
      diagnosingCount,
      repairingCount,
      waitingQcCount: list.filter(t => t.status === 'WaitingQC').length,
      inProgressCount,
      completedCount: list.filter(t => t.status === 'Completed').length,
      deliveredCount: list.filter(t => t.status === 'Delivered').length,
      totalCount: list.length,
    };
  },

  claimTicket: (ticketId: string, technicianId: string, technicianName: string): RepairTicketDto => {
    const list = repairSandboxService.getRepairs();
    const index = list.findIndex(t => t.id === ticketId || t.code === ticketId);
    if (index === -1) throw new Error('Không tìm thấy phiếu sửa chữa mẫu.');

    const target = list[index];
    target.technicianId = technicianId;
    target.technicianName = technicianName;
    target.status = 'Diagnosing';
    target.statusHistories.push({
      id: `hist-claim-${Date.now()}`,
      repairTicketId: target.id,
      status: 'Diagnosing',
      note: `KTV ${technicianName} đã nhận ca máy về bàn kỹ thuật thực hành.`,
      createdBy: technicianName,
      createdAt: new Date().toISOString(),
    });

    list[index] = target;
    localStorage.setItem(SANDBOX_REPAIRS_STORAGE_KEY, JSON.stringify(list));

    operationalNotificationService.dispatchNotification({
      title: `Nhận ca máy ${target.code} thành công`,
      content: `KTV ${technicianName} đã nhận máy ${target.productName} vào ca sửa.`,
      type: 'REPAIR_ASSIGNED',
      link: '/repairs?mode=training',
      targetRoles: ['Technician'],
      isSandbox: true,
    });

    window.dispatchEvent(new CustomEvent('psp_sandbox_repairs_updated'));
    return target;
  },

  updateStatus: (ticketId: string, newStatus: RepairTicketStatus, note?: string, actorName = 'KTV Thực Hành Demo'): RepairTicketDto => {
    const list = repairSandboxService.getRepairs();
    const index = list.findIndex(t => t.id === ticketId || t.code === ticketId);
    if (index === -1) throw new Error('Không tìm thấy phiếu sửa chữa mẫu.');

    const target = list[index];
    target.status = newStatus;
    if (newStatus === 'Completed') {
      target.completedDate = new Date().toISOString();
    }

    target.statusHistories.push({
      id: `hist-status-${Date.now()}`,
      repairTicketId: target.id,
      status: newStatus,
      note: note || `Chuyển trạng thái sang ${newStatus} trong chế độ Sandbox.`,
      createdBy: actorName,
      createdAt: new Date().toISOString(),
    });

    list[index] = target;
    localStorage.setItem(SANDBOX_REPAIRS_STORAGE_KEY, JSON.stringify(list));

    operationalNotificationService.dispatchNotification({
      title: `Cập nhật trạng thái ${target.code}`,
      content: `Phiếu sửa chữa ${target.code} đã chuyển sang [${newStatus}].`,
      type: 'GENERAL',
      link: '/repairs?mode=training',
      targetRoles: ['Technician', 'Manager'],
      isSandbox: true,
    });

    window.dispatchEvent(new CustomEvent('psp_sandbox_repairs_updated'));
    return target;
  },

  addPart: (ticketId: string, part: { productName: string; productSku: string; quantity: number; unitPrice: number }, actorName = 'KTV Thực Hành Demo'): RepairTicketDto => {
    const list = repairSandboxService.getRepairs();
    const index = list.findIndex(t => t.id === ticketId || t.code === ticketId);
    if (index === -1) throw new Error('Không tìm thấy phiếu sửa chữa.');

    const target = list[index];
    const newPart: RepairPartDto = {
      id: `part-demo-${Date.now()}`,
      repairTicketId: target.id,
      productVariantId: `pv-${Date.now()}`,
      productName: part.productName,
      productSku: part.productSku,
      quantity: part.quantity,
      unitPrice: part.unitPrice,
      totalPrice: part.quantity * part.unitPrice,
      addedAt: new Date().toISOString(),
      addedBy: actorName,
    };

    target.parts = [...(target.parts || []), newPart];
    target.partsTotal = target.parts.reduce((acc, p) => acc + p.totalPrice, 0);
    target.totalAmount = (target.laborCost || 0) + target.partsTotal;

    list[index] = target;
    localStorage.setItem(SANDBOX_REPAIRS_STORAGE_KEY, JSON.stringify(list));

    window.dispatchEvent(new CustomEvent('psp_sandbox_repairs_updated'));
    return target;
  },

  deliverRepair: (ticketId: string, actorName = 'KTV Thực Hành Demo'): RepairTicketDto => {
    return repairSandboxService.updateStatus(ticketId, 'Delivered', 'Đã nghiệm thu và bàn giao máy cho khách hàng kèm phiếu K80.', actorName);
  },

  resetToDefault: () => {
    const initial = createInitialSandboxRepairs();
    localStorage.setItem(SANDBOX_REPAIRS_STORAGE_KEY, JSON.stringify(initial));
    window.dispatchEvent(new CustomEvent('psp_sandbox_repairs_updated'));
  }
};
