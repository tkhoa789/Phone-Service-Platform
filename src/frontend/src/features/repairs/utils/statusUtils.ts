import type { RepairTicketStatus } from '../../../types/api.types';

export const ALL_REPAIR_STATUSES: RepairTicketStatus[] = [
  'PendingAssignment',
  'Received',
  'Diagnosing',
  'WaitingApproval',
  'WaitingForParts',
  'Repairing',
  'WaitingQC',
  'Completed',
  'WaitingPickup',
  'Delivered',
  'Cancelled'
];

export const getRepairStatusColor = (status: RepairTicketStatus): "default" | "success" | "danger" | "warning" | "info" => {
  switch (status) {
    case 'PendingAssignment': return 'warning';
    case 'Received': return 'default';
    case 'Diagnosing': return 'warning';
    case 'WaitingApproval': return 'warning';
    case 'WaitingForParts': return 'warning';
    case 'Repairing': return 'info';
    case 'WaitingQC': return 'info';
    case 'Completed': return 'success';
    case 'WaitingPickup': return 'success';
    case 'Delivered': return 'success';
    case 'Cancelled': return 'danger';
    default: return 'default';
  }
};

export const getRepairStatusLabel = (status: RepairTicketStatus, lang: 'vi' | 'en'): string => {
  const map: Record<RepairTicketStatus, { vi: string; en: string }> = {
    PendingAssignment: { vi: 'Chờ Phân Công', en: 'Pending Assignment' },
    Received: { vi: 'Tiếp Nhận', en: 'Received' },
    Diagnosing: { vi: 'Đang Chẩn Đoán', en: 'Diagnosing' },
    WaitingApproval: { vi: 'Chờ KH Duyệt Giá', en: 'Waiting Approval' },
    WaitingForParts: { vi: 'Chờ Linh Kiện', en: 'Waiting Parts' },
    Repairing: { vi: 'Đang Sửa Chữa', en: 'Repairing' },
    WaitingQC: { vi: 'Chờ Kiểm Định QC', en: 'Waiting QC' },
    Completed: { vi: 'Đã Hoàn Thành', en: 'Completed' },
    WaitingPickup: { vi: 'Chờ Khách Lấy Máy', en: 'Waiting Pickup' },
    Delivered: { vi: 'Đã Bàn Giao', en: 'Delivered' },
    Cancelled: { vi: 'Đã Hủy Phiếu', en: 'Cancelled' }
  };
  return map[status]?.[lang] || status;
};

// Define valid transitions for the UI dropdown matching backend state machine (RepairCommandHandlers.cs)
export const getValidTransitions = (status: RepairTicketStatus): RepairTicketStatus[] => {
  switch (status) {
    case 'PendingAssignment':
      // Backend: Received, Diagnosing, Cancelled
      return ['Received', 'Diagnosing', 'Cancelled'];
    case 'Received':
      // Backend: CHỈ ĐƯỢC Diagnosing (Bắt buộc chẩn đoán trước khi sửa) hoặc Cancelled
      return ['Diagnosing', 'Cancelled'];
    case 'Diagnosing':
      // Backend: WaitingApproval, WaitingForParts, Repairing, Cancelled
      return ['WaitingApproval', 'WaitingForParts', 'Repairing', 'Cancelled'];
    case 'WaitingApproval':
      // Backend: Repairing (khi khách duyệt), WaitingForParts, Cancelled
      return ['Repairing', 'WaitingForParts', 'Cancelled'];
    case 'WaitingForParts':
      // Backend: Repairing (khi linh kiện về), Cancelled
      return ['Repairing', 'Cancelled'];
    case 'Repairing':
      // Backend: WaitingQC, WaitingForParts, Completed, Cancelled
      return ['WaitingQC', 'WaitingForParts', 'Completed', 'Cancelled'];
    case 'WaitingQC':
      // Backend: Completed (QC Đạt), Repairing (QC Không Đạt trả về sửa lại)
      return ['Completed', 'Repairing'];
    case 'Completed':
      // Backend: WaitingPickup (Lưu kho chờ khách lấy)
      return ['WaitingPickup'];
    case 'WaitingPickup':
      // Backend: Delivered (Giao máy cho khách)
      return ['Delivered'];
    case 'Delivered':
      // Backend: Terminal state (Đã hoàn tất, không chuyển tiếp)
      return [];
    case 'Cancelled':
      // Backend: Terminal state (Đã hủy, linh kiện tự động hoàn kho)
      return [];
    default:
      return [];
  }
};

export interface StatusTransitionRule {
  status: RepairTicketStatus;
  labelVi: string;
  labelEn: string;
  stepNumber: number;
  badgeClass: string;
  summaryVi: string;
  backendCodeSnippet: string;
  allowed: Array<{
    status: RepairTicketStatus;
    labelVi: string;
    conditionVi: string;
    actionVi: string;
    noteVi?: string;
  }>;
  forbidden: Array<{
    targetLabelVi: string;
    reasonVi: string;
    backendErrorVi?: string;
    labelVi?: string;
  }>;
  backendRuleVi: string;
  backendAutomations: string[];
}

export const STATUS_TRANSITION_RULES: StatusTransitionRule[] = [
  {
    status: 'PendingAssignment',
    labelVi: 'Chờ Phân Công',
    labelEn: 'Pending Assignment',
    stepNumber: 1,
    badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300',
    summaryVi: 'Đơn vừa tạo ở Quầy Tiếp Nhận nhưng chưa có thợ: Chỉ được chuyển sang TIẾP NHẬN / CHẨN ĐOÁN (khi nhận việc) hoặc HỦY. Cấm mọi bước can thiệp kỹ thuật khác khi chưa có thợ phụ trách!',
    backendCodeSnippet: 'case RepairTicketStatus.PendingAssignment:\n    isValidTransition = request.Status == RepairTicketStatus.Received || request.Status == RepairTicketStatus.Diagnosing || request.Status == RepairTicketStatus.Cancelled;\n    break;',
    allowed: [
      {
        status: 'Received',
        labelVi: 'Tiếp Nhận',
        conditionVi: 'KTV bấm nút "Nhận việc" (tự gán) hoặc Quản lý chi nhánh chỉ định KTV phụ trách.',
        actionVi: 'Hệ thống gán TechnicianId và tự động đẩy trạng thái sang Tiếp Nhận.',
        noteVi: 'KTV bấm nút "Nhận việc" hoặc Quản lý chi nhánh chỉ định KTV phụ trách.'
      },
      {
        status: 'Diagnosing',
        labelVi: 'Đang Chẩn Đoán',
        conditionVi: 'KTV tự nhận đơn và đưa máy lên bàn kỹ thuật tháo kiểm tra pan bệnh ngay lập tức.',
        actionVi: 'Chuyển thẳng sang Đang Chẩn Đoán và gán KTV phụ trách.',
        noteVi: 'KTV tự nhận đơn và bắt tay tháo máy kiểm tra ngay.'
      },
      {
        status: 'Cancelled',
        labelVi: 'Đã Hủy Phiếu',
        conditionVi: 'Khách hàng đổi ý, xin lấy lại máy trước khi chi nhánh phân công KTV.',
        actionVi: 'Hủy phiếu, trả máy nguyên trạng cho khách.',
        noteVi: 'Khách hàng đổi ý xin lấy lại máy trước khi phân công KTV.'
      }
    ],
    forbidden: [
      {
        targetLabelVi: 'Đang Sửa Chữa (Repairing)',
        labelVi: 'Đang Sửa Chữa (Repairing)',
        reasonVi: 'TUYỆT ĐỐI BỊ CHẶN (Backend 409): Đơn chưa có người phụ trách và chưa khám bệnh, cấm nhảy vào sửa!',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Chờ Duyệt Giá / Chờ Linh Kiện',
        labelVi: 'Chờ Duyệt Giá / Chờ Linh Kiện',
        reasonVi: 'TUYỆT ĐỐI BỊ CHẶN (Backend 409): Chưa tháo máy kiểm tra thì chưa biết hỏng gì để báo giá hay đặt linh kiện.',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Chờ QC / Hoàn Thành / Chờ Lấy / Bàn Giao',
        labelVi: 'Chờ QC / Hoàn Thành / Chờ Lấy / Bàn Giao',
        reasonVi: 'CẤM NHẢY CÓC CỰC ĐOAN (Backend 409): Đơn chưa làm cấm nghiệm thu hay giao máy.',
        backendErrorVi: 'HTTP 409 Conflict'
      }
    ],
    backendRuleVi: 'Phân quyền RBAC nghiêm ngặt: KTV chỉ được tự nhận việc cho chính mình (gán người khác bị chặn 403 Forbidden). Chỉ Quản lý chi nhánh hoặc Admin mới được chỉ định thợ khác.',
    backendAutomations: [
      'Tự động gửi Notification SignalR real-time tới Quản lý chi nhánh khi tạo phiếu mà không chọn thợ.',
      'Yêu cầu bắt buộc header Idempotency-Key để chống duplicate submit.',
      'KTV nhận việc phải thuộc cùng BranchId với phiếu sửa chữa.'
    ]
  },
  {
    status: 'Received',
    labelVi: 'Tiếp Nhận',
    labelEn: 'Received',
    stepNumber: 2,
    badgeClass: 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300',
    summaryVi: 'Đơn đã có thợ phụ trách: KTV CHỈ CÓ DUY NHẤT 1 CON ĐƯỜNG KỸ THUẬT là tháo máy chuyển sang ĐANG CHẨN ĐOÁN (hoặc HỦY nếu khách đòi máy). TUYỆT ĐỐI CẤM nhảy cóc sang Sửa Chữa hay Hoàn Thành!',
    backendCodeSnippet: 'case RepairTicketStatus.Received:\n    isValidTransition = request.Status == RepairTicketStatus.Diagnosing || request.Status == RepairTicketStatus.Cancelled;\n    break;',
    allowed: [
      {
        status: 'Diagnosing',
        labelVi: 'Đang Chẩn Đoán',
        conditionVi: 'KTV đưa máy lên bàn kiểm tra, tháo bung ốc, đo đạc nguồn, xác định linh kiện hư hỏng và pan bệnh.',
        actionVi: 'BƯỚC BẮT BUỘC TIẾP THEO: Chọn "Đang Chẩn Đoán" để bắt đầu ghi nhận biên bản kiểm tra pan bệnh.',
        noteVi: 'BƯỚC BẮT BUỘC TIẾP THEO: KTV đưa máy lên bàn kiểm tra, bung máy đo đạc để xác định lỗi.'
      },
      {
        status: 'Cancelled',
        labelVi: 'Đã Hủy Phiếu',
        conditionVi: 'Khách hàng đổi ý, yêu cầu hủy tiếp nhận trước khi kỹ thuật viên tháo bung máy.',
        actionVi: 'Chọn "Đã Hủy Phiếu" -> Khép lại phiếu và bàn giao lại thiết bị nguyên trạng cho khách.',
        noteVi: 'Khách hàng yêu cầu hủy tiếp nhận trước khi kỹ thuật viên tháo máy.'
      }
    ],
    forbidden: [
      {
        targetLabelVi: 'Đang Sửa Chữa (Repairing)',
        labelVi: 'Đang Sửa Chữa (Repairing)',
        reasonVi: 'TUYỆT ĐỐI BỊ CHẶN (Backend 409 Conflict): CẤM NHẢY CÓC. Chưa tháo máy chẩn đoán pan bệnh thì không thể biết lỗi gì mà sửa! Bắt buộc phải qua Đang Chẩn Đoán.',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Đã Hoàn Thành (Completed)',
        labelVi: 'Đã Hoàn Thành (Completed)',
        reasonVi: 'TUYỆT ĐỐI BỊ CHẶN (Backend 409 Conflict): CẤM NHẢY CÓC CỰC ĐOAN. Một đơn vừa mới tiếp nhận không thể bấm hoàn thành ngay khi chưa qua sửa chữa!',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Chờ KH Duyệt Giá (WaitingApproval)',
        labelVi: 'Chờ KH Duyệt Giá (WaitingApproval)',
        reasonVi: 'Chưa tháo máy kiểm tra thực tế thì chưa có căn cứ kỹ thuật để phát sinh báo giá bổ sung cho khách.',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Chờ Linh Kiện (WaitingForParts)',
        labelVi: 'Chờ Linh Kiện (WaitingForParts)',
        reasonVi: 'Chưa chẩn đoán pan bệnh thì hệ thống cấm xuất kho hoặc tạo yêu cầu đặt linh kiện.',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Chờ QC / Chờ Lấy Máy / Đã Bàn Giao',
        labelVi: 'Chờ QC / Chờ Lấy Máy / Đã Bàn Giao',
        reasonVi: 'Vi phạm nghiêm trọng quy trình kỹ thuật tuyến tính của hệ thống.',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Chờ Phân Công (PendingAssignment)',
        labelVi: 'Chờ Phân Công (PendingAssignment)',
        reasonVi: 'Đơn đã tiếp nhận không được phép quay lùi về trạng thái chưa ai nhận.',
        backendErrorVi: 'HTTP 409 Conflict'
      }
    ],
    backendRuleVi: 'KTV phụ trách bắt buộc phải thuộc cùng chi nhánh với phiếu sửa. Backend kiểm tra nghiêm ngặt ScopeContext. Vi phạm nhảy cóc sẽ ném lỗi: "Không được phép chuyển đổi trạng thái từ Received sang ... theo quy trình nghiệp vụ."',
    backendAutomations: [
      'Xác thực quyền chi nhánh ScopeContext.BranchId của CurrentUser.',
      'Ghi nhận lịch sử chuyển trạng thái vào bảng RepairStatusHistories.',
      'Chặn đứng toàn bộ các chuyển đổi trái phép bằng Exception 409 Conflict.'
    ]
  },
  {
    status: 'Diagnosing',
    labelVi: 'Đang Chẩn Đoán',
    labelEn: 'Diagnosing',
    stepNumber: 3,
    badgeClass: 'bg-amber-500/20 border-amber-500/40 text-amber-800 dark:text-amber-200',
    summaryVi: 'Máy đang trên bàn kiểm tra: Sau khi có kết luận, KTV có thể gửi Duyệt Giá (nếu chi phí cao), Chờ Linh Kiện (nếu hết hàng), bắt đầu Sửa Chữa, hoặc Hủy nếu máy nát không sửa được. Cấm nhảy sang Hoàn Thành!',
    backendCodeSnippet: 'case RepairTicketStatus.Diagnosing:\n    isValidTransition = request.Status == RepairTicketStatus.WaitingApproval || request.Status == RepairTicketStatus.WaitingForParts || request.Status == RepairTicketStatus.Repairing || request.Status == RepairTicketStatus.Cancelled;\n    break;',
    allowed: [
      {
        status: 'WaitingApproval',
        labelVi: 'Chờ KH Duyệt Giá',
        conditionVi: 'Tháo máy phát hiện hỏng thêm linh kiện đắt tiền, chi phí phát sinh vượt mức khách đồng ý ban đầu.',
        actionVi: 'Chuyển sang "Chờ KH Duyệt Giá" để tư vấn viên liên hệ xin phê duyệt từ khách hàng.',
        noteVi: 'Phát hiện bệnh mới hoặc chi phí vượt mức ước tính ban đầu -> cần khách hàng đồng ý.'
      },
      {
        status: 'WaitingForParts',
        labelVi: 'Chờ Linh Kiện',
        conditionVi: 'Đã xác định linh kiện cần thay nhưng kho chi nhánh hiện tại đang tạm hết hàng.',
        actionVi: 'Chuyển sang "Chờ Linh Kiện" để tạo phiếu yêu cầu xuất/chuyển kho.',
        noteVi: 'Đã xác định linh kiện cần thay nhưng kho chi nhánh hiện tại đang tạm hết hàng.'
      },
      {
        status: 'Repairing',
        labelVi: 'Đang Sửa Chữa',
        conditionVi: 'Đã xác định rõ pan bệnh, linh kiện sẵn có và chi phí nằm trong hạn mức khách đã đồng ý.',
        actionVi: 'Chuyển sang "Đang Sửa Chữa" để bắt đầu quy trình thay thế, hàn mạch, lắp ráp.',
        noteVi: 'Khách đã đồng ý và linh kiện đã sẵn sàng tại bàn kỹ thuật -> bắt đầu sửa.'
      },
      {
        status: 'Cancelled',
        labelVi: 'Đã Hủy Phiếu',
        conditionVi: 'Máy bị cháy nát mainboard, chập CPU không thể cứu chữa hoặc khách không đồng ý sửa tại bàn.',
        actionVi: 'Chuyển sang "Đã Hủy Phiếu" để trả máy.',
        noteVi: 'Máy bị hỏng main quá nặng không thể phục hồi hoặc khách không đồng ý phương án sửa.'
      }
    ],
    forbidden: [
      {
        targetLabelVi: 'Đã Hoàn Thành (Completed)',
        labelVi: 'Đã Hoàn Thành (Completed)',
        reasonVi: 'CẤM NHẢY CÓC (Backend 409 Conflict): Mới chẩn đoán xong chưa sửa chữa (Repairing) thì tuyệt đối không thể hoàn thành!',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Chờ Kiểm Định QC (WaitingQC)',
        labelVi: 'Chờ Kiểm Định QC (WaitingQC)',
        reasonVi: 'Chưa sửa xong thì không có sản phẩm hoàn thiện để kiểm định chất lượng!',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Chờ Khách Lấy / Đã Bàn Giao',
        labelVi: 'Chờ Khách Lấy / Đã Bàn Giao',
        reasonVi: 'Cấm giao máy cho khách khi ca sửa chữa chưa được tiến hành.',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Lùi về Tiếp Nhận / Chờ Phân Công',
        labelVi: 'Lùi về Tiếp Nhận / Chờ Phân Công',
        reasonVi: 'Quy trình tuyến tính không cho phép thụt lùi về khâu chưa phân công/tiếp nhận.',
        backendErrorVi: 'HTTP 409 Conflict'
      }
    ],
    backendRuleVi: 'Phải ghi nhận chẩn đoán (RootCause & ProposedSolution) khi chẩn đoán. Backend ghi lịch sử vào RepairStatusHistories.',
    backendAutomations: [
      'Lưu vết chẩn đoán lỗi vào phiếu sửa chữa.',
      'Cập nhật tiến trình thời gian thực lên hệ thống.'
    ]
  },
  {
    status: 'WaitingApproval',
    labelVi: 'Chờ KH Duyệt Giá',
    labelEn: 'Waiting Approval',
    stepNumber: 4,
    badgeClass: 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300',
    summaryVi: 'Đang chờ khách phản hồi: Khách đồng ý -> chuyển ĐANG SỬA hoặc CHỜ LINH KIỆN. Khách từ chối -> HỦY PHIẾU trả máy. Cấm nhảy thẳng sang Hoàn thành!',
    backendCodeSnippet: 'case RepairTicketStatus.WaitingApproval:\n    isValidTransition = request.Status == RepairTicketStatus.Repairing || request.Status == RepairTicketStatus.WaitingForParts || request.Status == RepairTicketStatus.Cancelled;\n    break;',
    allowed: [
      {
        status: 'Repairing',
        labelVi: 'Đang Sửa Chữa',
        conditionVi: 'Khách hàng gọi điện hoặc nhắn tin đồng ý với phương án và chi phí sửa chữa bổ sung.',
        actionVi: 'Chuyển sang "Đang Sửa Chữa" để thợ tiếp tục can thiệp phần cứng.',
        noteVi: 'Khách hàng đã gọi điện / nhắn tin đồng ý với phương án và giá báo thêm.'
      },
      {
        status: 'WaitingForParts',
        labelVi: 'Chờ Linh Kiện',
        conditionVi: 'Khách đồng ý sửa nhưng linh kiện hiếm cần thời gian đặt hàng từ nhà cung cấp.',
        actionVi: 'Chuyển sang "Chờ Linh Kiện" để chờ phụ tùng về.',
        noteVi: 'Khách đồng ý nhưng linh kiện cần đặt thêm thời gian từ nhà cung cấp.'
      },
      {
        status: 'Cancelled',
        labelVi: 'Đã Hủy Phiếu',
        conditionVi: 'Khách hàng chê giá đắt hoặc từ chối sửa chữa.',
        actionVi: 'Chuyển sang "Đã Hủy Phiếu", đóng máy trả khách và hoàn cọc (nếu có).',
        noteVi: 'Khách chê giá cao hoặc từ chối sửa -> Hủy phiếu, trả máy và hoàn cọc (nếu có).'
      }
    ],
    forbidden: [
      {
        targetLabelVi: 'Đã Hoàn Thành (Completed)',
        labelVi: 'Đã Hoàn Thành (Completed)',
        reasonVi: 'Khách mới duyệt giá, máy chưa sửa xong, cấm nhảy thẳng sang hoàn thành! (Backend 409)',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Chờ QC / Chờ Lấy / Bàn Giao',
        labelVi: 'Chờ QC / Chờ Lấy / Bàn Giao',
        reasonVi: 'Chưa sửa thì không thể kiểm định hay giao máy.',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Lùi về Đang Chẩn Đoán / Tiếp Nhận',
        labelVi: 'Lùi về Đang Chẩn Đoán / Tiếp Nhận',
        reasonVi: 'Máy đã chẩn đoán xong đang chờ chốt, không lùi về bước khám bệnh.',
        backendErrorVi: 'HTTP 409 Conflict'
      }
    ],
    backendRuleVi: 'Cần lưu lại phương thức phê duyệt (Gọi điện/Trực tiếp) và số tiền khách đã duyệt.',
    backendAutomations: [
      'Ghi nhận hạn mức chi phí được khách phê duyệt.',
      'Bắn thông báo nội bộ cho KTV phụ trách khi khách đồng ý giá.'
    ]
  },
  {
    status: 'WaitingForParts',
    labelVi: 'Chờ Linh Kiện',
    labelEn: 'Waiting Parts',
    stepNumber: 5,
    badgeClass: 'bg-amber-600/15 border-amber-600/30 text-amber-700 dark:text-amber-300',
    summaryVi: 'Đang chờ linh kiện về bàn sửa: Linh kiện về kho -> chuyển sang ĐANG SỬA CHỮA để thợ thay. Hết hàng không thể nhập -> HỦY PHIẾU. Cấm nghiệm thu Hoàn thành khi chưa lắp linh kiện!',
    backendCodeSnippet: 'case RepairTicketStatus.WaitingForParts:\n    isValidTransition = request.Status == RepairTicketStatus.Repairing || request.Status == RepairTicketStatus.Cancelled;\n    break;',
    allowed: [
      {
        status: 'Repairing',
        labelVi: 'Đang Sửa Chữa',
        conditionVi: 'Linh kiện đã về kho chi nhánh và được xuất cho thợ tại bàn kỹ thuật.',
        actionVi: 'Chuyển sang "Đang Sửa Chữa" để KTV tiến hành lắp ráp và thay thế.',
        noteVi: 'Linh kiện đã về kho chi nhánh và được xuất ra bàn kỹ thuật -> KTV tiến hành thay.'
      },
      {
        status: 'Cancelled',
        labelVi: 'Đã Hủy Phiếu',
        conditionVi: 'Linh kiện đã hết sản xuất, không tìm thấy linh kiện thay thế hoặc khách không thể chờ đợi lâu.',
        actionVi: 'Chuyển sang "Đã Hủy Phiếu" để trả lại thiết bị cho khách.',
        noteVi: 'Không tìm thấy linh kiện phù hợp trên thị trường hoặc khách không thể đợi lâu.'
      }
    ],
    forbidden: [
      {
        targetLabelVi: 'Đã Hoàn Thành (Completed)',
        labelVi: 'Đã Hoàn Thành (Completed)',
        reasonVi: 'CẤM NHẢY CÓC (Backend 409 Conflict): Linh kiện chưa lắp vào máy thì tuyệt đối không được nghiệm thu hoàn tất!',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Chờ QC / Chờ Lấy / Bàn Giao',
        labelVi: 'Chờ QC / Chờ Lấy / Bàn Giao',
        reasonVi: 'Cấm xuất trả máy khi ca sửa chữa chưa hoàn tất.',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Chờ KH Duyệt Giá',
        labelVi: 'Chờ KH Duyệt Giá',
        reasonVi: 'Báo giá đã được chốt trước khi xin phụ tùng, không đảo ngược quy trình.',
        backendErrorVi: 'HTTP 409 Conflict'
      }
    ],
    backendRuleVi: 'Khi xuất linh kiện vào đơn (POST /parts), Backend tự động trừ tồn kho và ràng buộc IMEI linh kiện nếu có.',
    backendAutomations: [
      'Tự động trừ số lượng tồn kho của chi nhánh: Inventory.Quantity -= part.Quantity.',
      'Gắn serial IMEI linh kiện vào đơn sửa chữa.'
    ]
  },
  {
    status: 'Repairing',
    labelVi: 'Đang Sửa Chữa',
    labelEn: 'Repairing',
    stepNumber: 6,
    badgeClass: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
    summaryVi: 'KTV đang trực tiếp can thiệp phần cứng/phần mềm: Sửa xong chuyển CHỜ QC (hoặc HOÀN THÀNH nếu tự test). Hỏng linh kiện -> Chờ Linh Kiện. Rủi ro hỏng nặng -> Hủy. CẤM NHẢY THẲNG SANG CHỜ GIAO!',
    backendCodeSnippet: 'case RepairTicketStatus.Repairing:\n    isValidTransition = request.Status == RepairTicketStatus.WaitingQC || request.Status == RepairTicketStatus.WaitingForParts || request.Status == RepairTicketStatus.Completed || request.Status == RepairTicketStatus.Cancelled;\n    break;',
    allowed: [
      {
        status: 'WaitingQC',
        labelVi: 'Chờ Kiểm Định QC',
        conditionVi: 'KTV đã hoàn tất sửa chữa phần cứng/phần mềm, chuyển sang khâu kiểm thử QC độc lập 8 điểm chất lượng.',
        actionVi: 'Chuyển sang "Chờ Kiểm Định QC".',
        noteVi: 'Sửa xong phần cứng/phần mềm -> Chuyển sang khâu kiểm thử QC độc lập 8 điểm.'
      },
      {
        status: 'Completed',
        labelVi: 'Đã Hoàn Thành',
        conditionVi: 'Đã sửa xong hoàn hảo và KTV tự kiểm tra toàn diện đạt chuẩn 100% (quy trình tự nghiệm thu tại chi nhánh).',
        actionVi: 'Chuyển sang "Đã Hoàn Thành" -> Backend tự động chốt viện phí thực tế.',
        noteVi: 'Đã sửa xong hoàn hảo (áp dụng khi KTV kiêm luôn kiểm thử đạt chuẩn).'
      },
      {
        status: 'WaitingForParts',
        labelVi: 'Chờ Linh Kiện',
        conditionVi: 'Đang sửa phát hiện linh kiện lắp vào bị lỗi hoặc phát sinh cần thêm linh kiện phụ.',
        actionVi: 'Chuyển sang "Chờ Linh Kiện" để chờ kho cấp đổi phụ tùng mới.',
        noteVi: 'Đang sửa phát hiện linh kiện lắp vào bị lỗi hoặc cần thêm phụ tùng khác.'
      },
      {
        status: 'Cancelled',
        labelVi: 'Đã Hủy Phiếu',
        conditionVi: 'Phát sinh sự cố kỹ thuật bất khả kháng trong quá trình can thiệp nhiệt/đục chip khiến máy hỏng hẳn.',
        actionVi: 'Chuyển sang "Đã Hủy Phiếu" -> Kích hoạt cơ chế tự động hoàn linh kiện.',
        noteVi: 'Phát sinh sự cố kỹ thuật bất khả kháng trong quá trình can thiệp phần cứng.'
      }
    ],
    forbidden: [
      {
        targetLabelVi: 'Chờ Khách Lấy Máy (WaitingPickup)',
        labelVi: 'Chờ Khách Lấy Máy (WaitingPickup)',
        reasonVi: 'CẤM NHẢY CÓC BẮT BUỘC (Backend 409): Phải qua nghiệm thu Hoàn thành (Completed) để Backend tự động chốt chi phí thực tế (LaborCost + PartsTotal) trước khi cất tủ chờ khách!',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Đã Bàn Giao (Delivered)',
        labelVi: 'Đã Bàn Giao (Delivered)',
        reasonVi: 'Cấm giao máy trực tiếp từ bàn thợ khi chưa có lệnh nghiệm thu hoàn thành!',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Lùi về Tiếp Nhận / Chờ Phân Công',
        labelVi: 'Lùi về Tiếp Nhận / Chờ Phân Công',
        reasonVi: 'Máy đã bung và đang sửa chữa, không thể lùi về trạng thái chưa làm.',
        backendErrorVi: 'HTTP 409 Conflict'
      }
    ],
    backendRuleVi: 'Chỉ KTV được phân công phụ trách đơn mới có quyền cập nhật tiến độ hoặc xuất linh kiện.',
    backendAutomations: [
      'Khi chuyển sang Completed, Backend tự động tính toán tổng chi phí: ActualCost = LaborCost + PartsTotal.',
      'Gán thời gian hoàn thành: CompletedDate = DateTime.UtcNow.'
    ]
  },
  {
    status: 'WaitingQC',
    labelVi: 'Chờ Kiểm Định QC',
    labelEn: 'Waiting QC',
    stepNumber: 7,
    badgeClass: 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300',
    summaryVi: 'Khâu kiểm định chất lượng độc lập: Chỉ có 2 kết quả: QC ĐẠT -> chuyển HOÀN THÀNH. QC KHÔNG ĐẠT -> trả về ĐANG SỬA CHỮA để thợ làm lại. Cấm hủy đơn tại bàn QC và cấm giao máy ngay!',
    backendCodeSnippet: 'case RepairTicketStatus.WaitingQC:\n    isValidTransition = request.Status == RepairTicketStatus.Repairing || request.Status == RepairTicketStatus.Completed;\n    break;',
    allowed: [
      {
        status: 'Completed',
        labelVi: 'Đã Hoàn Thành',
        conditionVi: 'QC ĐẠT CHUẨN (PASS): Toàn bộ 8 bài test kỹ thuật (Màn hình, Cảm ứng, Pin, Loa/Mic, Camera, FaceID/Vân tay, Sóng/WiFi, Sạc) đều PASS.',
        actionVi: 'Chuyển sang "Đã Hoàn Thành" để chốt viện phí.',
        noteVi: 'QC ĐẠT: Toàn bộ 8 điểm kỹ thuật (Màn, Pin, Loa, Sóng, Cam, FaceID...) đều PASS.'
      },
      {
        status: 'Repairing',
        labelVi: 'Đang Sửa Chữa',
        conditionVi: 'QC KHÔNG ĐẠT (FAIL): Phát hiện lỗi còn sót hoặc tính năng chưa đạt chuẩn chất lượng.',
        actionVi: 'Trả máy về cho KTV phụ trách để tháo ra khắc phục lại.',
        noteVi: 'QC KHÔNG ĐẠT: Phát hiện lỗi sót hoặc phát sinh, trả lại bàn thợ để khắc phục lại.'
      }
    ],
    forbidden: [
      {
        targetLabelVi: 'Đã Hủy Phiếu (Cancelled)',
        labelVi: 'Đã Hủy Phiếu (Cancelled)',
        reasonVi: 'Khâu QC không có quyền hủy phiếu trực tiếp! Nếu máy không thể sửa được, QC phải trả về Đang Sửa Chữa để KTV lập biên bản kỹ thuật trước khi hủy.',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Chờ Khách Lấy / Đã Bàn Giao',
        labelVi: 'Chờ Khách Lấy / Đã Bàn Giao',
        reasonVi: 'Cấm giao máy khi chưa có kết quả nghiệm thu QC chính thức thành Completed!',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Chuyển sang Chẩn Đoán / Tiếp Nhận',
        labelVi: 'Chuyển sang Chẩn Đoán / Tiếp Nhận',
        reasonVi: 'Khâu QC chỉ có 2 kết quả: Đạt (Completed) hoặc Trả lại sửa (Repairing).',
        backendErrorVi: 'HTTP 409 Conflict'
      }
    ],
    backendRuleVi: 'Biên bản Check-out QC được lưu trữ vĩnh viễn kèm chữ ký/ghi nhận người kiểm định.',
    backendAutomations: [
      'Khi QC PASS -> Completed: Backend tự động chốt ActualCost và khóa linh kiện.',
      'Khi QC FAIL -> Repairing: Ghi log lần kiểm định không đạt vào lịch sử.'
    ]
  },
  {
    status: 'Completed',
    labelVi: 'Đã Hoàn Thành',
    labelEn: 'Completed',
    stepNumber: 8,
    badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
    summaryVi: 'Máy đã sửa xong hoàn chỉnh và chốt tổng viện phí: CHỈ ĐƯỢC CHUYỂN SANG DUY NHẤT 1 TRẠNG THÁI là CHỜ KHÁCH LẤY MÁY. Cấm bàn giao ngay và cấm hủy phiếu!',
    backendCodeSnippet: 'case RepairTicketStatus.Completed:\n    isValidTransition = request.Status == RepairTicketStatus.WaitingPickup;\n    break;',
    allowed: [
      {
        status: 'WaitingPickup',
        labelVi: 'Chờ Khách Lấy Máy',
        conditionVi: 'DUY NHẤT 1 HƯỚNG: Máy đã vệ sinh sạch dán tem vỡ bảo hành, cất vào tủ lưu kho quầy tiếp tân và gửi thông báo cho khách.',
        actionVi: 'Chuyển sang "Chờ Khách Lấy Máy".',
        noteVi: 'Máy đã vệ sinh sạch dán tem bảo hành, cất tủ lưu kho và nhắn khách đến lấy.'
      }
    ],
    forbidden: [
      {
        targetLabelVi: 'Đã Bàn Giao (Delivered)',
        labelVi: 'Đã Bàn Giao (Delivered)',
        reasonVi: 'CẤM NHẢY CÓC (Backend 409): Phải qua bước cất kho chờ giao và đối soát công nợ/tiền cọc trước khi trao máy!',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Đã Hủy Phiếu (Cancelled)',
        labelVi: 'Đã Hủy Phiếu (Cancelled)',
        reasonVi: 'Phiếu đã hoàn thành và chốt tiền thực tế, cấm bấm hủy thông thường!',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Quay lại Đang Sửa / Chẩn Đoán / QC',
        labelVi: 'Quay lại Đang Sửa / Chẩn Đoán / QC',
        reasonVi: 'Phiếu đã hoàn thành và niêm phong dán tem, cấm quay lại giai đoạn kỹ thuật.',
        backendErrorVi: 'HTTP 409 Conflict'
      }
    ],
    backendRuleVi: 'Khi chuyển sang Completed, Backend tự động tính toán tổng chi phí: ActualCost = LaborCost + PartsTotal và gán CompletedDate.',
    backendAutomations: [
      'Backend tự động tính ActualCost = LaborCost + PartsTotal.',
      'Gán CompletedDate = DateTime.UtcNow.',
      'Khóa chỉnh sửa danh sách linh kiện trong đơn.'
    ]
  },
  {
    status: 'WaitingPickup',
    labelVi: 'Chờ Khách Lấy Máy',
    labelEn: 'Waiting Pickup',
    stepNumber: 9,
    badgeClass: 'bg-teal-500/15 border-teal-500/30 text-teal-700 dark:text-teal-300',
    summaryVi: 'Máy đang nằm tại tủ bảo quản của quầy tiếp tân: CHỈ ĐƯỢC CHUYỂN SANG DUY NHẤT 1 TRẠNG THÁI là ĐÃ BÀN GIAO khi khách đến quầy thanh toán và nhận máy.',
    backendCodeSnippet: 'case RepairTicketStatus.WaitingPickup:\n    isValidTransition = request.Status == RepairTicketStatus.Delivered;\n    break;',
    allowed: [
      {
        status: 'Delivered',
        labelVi: 'Đã Bàn Giao',
        conditionVi: 'DUY NHẤT 1 HƯỚNG: Khách đến quầy xuất trình phiếu biên nhận, kiểm tra máy tại chỗ, thanh toán số tiền còn lại và nhận máy.',
        actionVi: 'Chuyển sang "Đã Bàn Giao" để khép lại chu trình sửa chữa.',
        noteVi: 'Khách đến nhận máy, kiểm tra lại, thanh toán tiền còn lại và ký biên bản giao nhận.'
      }
    ],
    forbidden: [
      {
        targetLabelVi: 'Quay về các bước kỹ thuật (Sửa chữa, Chẩn đoán...)',
        labelVi: 'Quay về các bước kỹ thuật (Sửa chữa, Chẩn đoán...)',
        reasonVi: 'Máy đã hoàn thiện nằm tại quầy giao trả, không được chuyển về bàn kỹ thuật.',
        backendErrorVi: 'HTTP 409 Conflict'
      },
      {
        targetLabelVi: 'Đã Hủy Phiếu (Cancelled)',
        labelVi: 'Đã Hủy Phiếu (Cancelled)',
        reasonVi: 'Máy đã sửa xong nằm chờ giao, không thể hủy đơn.',
        backendErrorVi: 'HTTP 409 Conflict'
      }
    ],
    backendRuleVi: 'Kiểm tra tiền cọc đã thu (RepairDeposits), in hóa đơn hoặc phiếu biên nhận K80 quyết toán trước khi giao máy.',
    backendAutomations: [
      'Đối soát số tiền còn lại phải thu: ActualCost - Tổng tiền cọc.',
      'In biên nhận bàn giao và kích hoạt bảo hành.'
    ]
  },
  {
    status: 'Delivered',
    labelVi: 'Đã Bàn Giao',
    labelEn: 'Delivered',
    stepNumber: 10,
    badgeClass: 'bg-emerald-600/20 border-emerald-600/40 text-emerald-800 dark:text-emerald-200',
    summaryVi: 'TRẠNG THÁI KẾT THÚC (Terminal State): Chu trình sửa chữa đã khép lại 100%. Khách đã thanh toán và nhận máy về. Không cho phép chuyển tiếp.',
    backendCodeSnippet: 'case RepairTicketStatus.Delivered:\n    isValidTransition = false; // Terminal state (Đã hoàn tất)',
    allowed: [],
    forbidden: [
      {
        targetLabelVi: 'Chuyển sang bất kỳ trạng thái nào khác',
        labelVi: 'Chuyển sang bất kỳ trạng thái nào khác',
        reasonVi: 'ĐÂY LÀ TRẠNG THÁI KẾT THÚC (Terminal State). Chu trình sửa chữa đã khép lại 100%. Khách đã nhận máy và kích hoạt thời hạn bảo hành.',
        backendErrorVi: 'HTTP 409 Conflict'
      }
    ],
    backendRuleVi: 'Vé đã giao khách thành công. Không thể chỉnh sửa hoặc chuyển đổi trạng thái nữa.',
    backendAutomations: [
      'Kích hoạt thời hạn bảo hành theo linh kiện/dịch vụ.',
      'Khóa vĩnh viễn dữ liệu phiếu sửa chữa.'
    ]
  },
  {
    status: 'Cancelled',
    labelVi: 'Đã Hủy Phiếu',
    labelEn: 'Cancelled',
    stepNumber: 11,
    badgeClass: 'bg-rose-500/20 border-rose-500/40 text-rose-800 dark:text-rose-200',
    summaryVi: 'TRẠNG THÁI KẾT THÚC (Terminal State): Phiếu đã bị hủy bỏ. Backend TỰ ĐỘNG KÍCH HOẠT HOÀN KHO TOÀN BỘ LINH KIỆN và khôi phục IMEI.',
    backendCodeSnippet: 'case RepairTicketStatus.Cancelled:\n    isValidTransition = false; // Terminal state (Tự động hoàn kho & khôi phục IMEI)',
    allowed: [],
    forbidden: [
      {
        targetLabelVi: 'Chuyển sang bất kỳ trạng thái nào khác',
        labelVi: 'Chuyển sang bất kỳ trạng thái nào khác',
        reasonVi: 'ĐÂY LÀ TRẠNG THÁI KẾT THÚC (Terminal State). Phiếu đã hủy không thể kích hoạt lại. Nếu khách muốn sửa lại phải tạo phiếu mới.',
        backendErrorVi: 'HTTP 409 Conflict'
      }
    ],
    backendRuleVi: 'Backend tự động kích hoạt nghiệp vụ ROLLBACK: Trả lại toàn bộ linh kiện đã xuất về kho và phục hồi trạng thái IMEI về InStock.',
    backendAutomations: [
      'TỰ ĐỘNG HOÀN TRẢ LINH KIỆN VỀ KHO: Inventory.Quantity += part.Quantity.',
      'Đánh dấu xóa mềm linh kiện trong phiếu: partRepo.Remove(part).',
      'TỰ ĐỘNG KHÔI PHỤC IMEI: Đổi trạng thái thiết bị và linh kiện về lại InStock trong kho.'
    ]
  }
];

