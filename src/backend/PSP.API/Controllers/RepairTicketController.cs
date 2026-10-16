using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.API.Attributes;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Repair.Commands;
using PSP.Application.Modules.Repair.DTOs;
using PSP.Application.Modules.Repair.Queries;
using PSP.Domain.Common.Constants;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PSP.API.Controllers;

/// <summary>
/// API Controller quản lý các Phiếu sửa chữa thiết bị dịch vụ (RepairTickets).
/// </summary>
[Authorize(Policy = Permissions.Repair.View)]
[Route("api/[controller]")]
[Tags("RepairTickets")]
public class RepairTicketController : BaseApiController
{
    /// <summary>
    /// API Tạo mới Phiếu sửa chữa (Repair.CREATE).
    /// POST: /api/RepairTicket
    /// </summary>
    [Authorize(Policy = Permissions.Repair.Create)]
    [HttpPost]
    [Idempotent]
    public async Task<IActionResult> Create([FromBody] CreateRepairTicketCommand command, CancellationToken cancellationToken)
    {
        // Chỉ tài khoản có role Admin, Owner hoặc QA mới được phép kích hoạt cờ IsTest (qua Header hoặc Request Body).
        // Nếu không có quyền, hệ thống âm thầm gán IsTest = false để không làm vỡ luồng tiếp nhận của người dùng.
        var isPrivilegedForTest = User.IsInRole("Admin") || User.IsInRole("Owner") || User.IsInRole("QA");
        bool isTest = false;

        if (isPrivilegedForTest)
        {
            if (Request.Headers.TryGetValue("X-PSP-Is-Test", out var isTestHeader) && bool.TryParse(isTestHeader, out var parsedIsTest))
            {
                isTest = parsedIsTest;
            }
            else if (command.IsTest)
            {
                isTest = true;
            }
        }

        command = command with { IsTest = isTest };
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Lập phiếu tiếp nhận sửa chữa thành công"));
    }

    /// <summary>
    /// API Xuất/thêm linh kiện thay thế cho phiếu sửa chữa (Repair.UPDATE).
    /// POST: /api/RepairTicket/part
    /// </summary>
    [Authorize(Policy = Permissions.Repair.Update)]
    [HttpPost("{id}/parts")]
    [Idempotent]
    public async Task<IActionResult> AddPart(Guid id, [FromBody] AddRepairPartCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Xuất linh kiện thay thế thành công"));
    }

    /// <summary>
    /// API Tạo mới Biên bản kiểm tra tình trạng máy (Repair.DIAGNOSE).
    /// POST: /api/RepairTicket/checklist
    /// </summary>
    [Authorize(Policy = Permissions.Repair.Diagnose)]
    [HttpPost("checklist")]
    public async Task<IActionResult> CreateChecklist([FromBody] CreateRepairChecklistCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Lưu biên bản kiểm tra thành công"));
    }

    /// <summary>
    /// API Cập nhật trạng thái phiếu sửa chữa (Repair.UPDATE).
    /// PUT: /api/RepairTicket/{id}/status
    /// </summary>
    [Authorize(Policy = Permissions.Repair.Update)]
    [HttpPut("{id}/status")]
    [Idempotent]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateRepairStatusCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id phiếu trong URL và body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật trạng thái sửa chữa thành công"));
    }

    /// <summary>
    /// API Xóa mềm phiếu sửa chữa (Repair.CANCEL - Owner, Admin, Manager).
    /// DELETE: /api/RepairTicket/{id}
    /// </summary>
    [Authorize(Policy = Permissions.Repair.Cancel)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteRepairTicketCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "XÃ³a phiáº¿u sá»­a chá»¯a thÃ nh cÃ´ng"));
    }

    /// <summary>
    /// API Láº¥y thÃ´ng tin chi tiáº¿t má»™t phiáº¿u sá»­a chá»¯a kÃ¨m linh kiá»‡n thay tháº¿ vÃ  lá»‹ch sá»­ tráº¡ng thÃ¡i.
    /// GET: /api/RepairTicket/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetRepairTicketByIdQuery(id);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<RepairTicketDto>.Success(result));
    }

    /// <summary>
    /// API Lấy danh sách phiếu sửa chữa có hỗ trợ lọc theo hàng chờ (Queue) và phân trang.
    /// GET: /api/RepairTicket
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] GetRepairTicketsQuery query, CancellationToken cancellationToken)
    {
        var (items, totalCount) = await Mediator.Send(query, cancellationToken);
        var stats = await Mediator.Send(new GetRepairQueueStatsQuery(query.IncludeTest), cancellationToken);
        
        return Ok(new
        {
            success = true,
            message = "Lấy danh sách phiếu sửa chữa thành công",
            data = items,
            pagination = new
            {
                pageIndex = query.PageIndex,
                pageSize = query.PageSize,
                totalCount = totalCount
            },
            stats = stats
        });
    }

    /// <summary>
    /// API Lấy số liệu thống kê các hàng chờ sửa chữa (Unassigned, My Tasks, In Progress, Completed, Total) trực tiếp từ Database.
    /// GET: /api/RepairTicket/stats
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetQueueStats([FromQuery] bool includeTest = false, CancellationToken cancellationToken = default)
    {
        var query = new GetRepairQueueStatsQuery(includeTest);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<RepairQueueStatsDto>.Success(result));
    }

    /// <summary>
    /// API Thu tiền cọc cho phiếu sửa chữa (Chỉ thu được khi phiếu chưa hoàn thành/hủy).
    /// POST: /api/RepairTicket/{id}/deposit
    /// </summary>
    [Authorize(Policy = Permissions.Repair.Deposit)]
    [HttpPost("{id}/deposits")]
    [Idempotent]
    public async Task<IActionResult> CreateDeposit(Guid id, [FromBody] CreateRepairDepositCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId)
        {
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id phiếu trong URL và body không khớp."));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Thu tiền cọc thành công"));
    }

    /// <summary>
    /// API Hoàn trả tiền cọc cho khách hàng (thường dùng khi Hủy phiếu).
    /// POST: /api/RepairTicket/deposit/{depositId}/refund
    /// </summary>
    [Authorize(Policy = Permissions.Repair.Refund)]
    [HttpPost("deposit/{depositId:guid}/refund")]
    public async Task<IActionResult> RefundDeposit(Guid depositId, CancellationToken cancellationToken)
    {
        var command = new RefundRepairDepositCommand(depositId);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Hoàn trả tiền cọc thành công"));
    }

    /// <summary>
    /// API Cập nhật trạng thái linh kiện thay thế (Issue / Install).
    /// PUT: /api/RepairTicket/{id}/part/{partId}/status
    /// </summary>
    [Authorize(Policy = Permissions.Repair.UpdatePart)]
    [HttpPut("{id:guid}/part/{partId:guid}/status")]
    public async Task<IActionResult> UpdatePartStatus(Guid id, Guid partId, [FromBody] UpdateRepairPartStatusCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId || partId != command.RepairPartId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Cập nhật trạng thái linh kiện thành công"));
    }

    /// <summary>
    /// API Hoàn trả linh kiện (Return).
    /// POST: /api/RepairTicket/{id}/part/{partId}/return
    /// </summary>
    [Authorize(Policy = Permissions.Repair.ReturnPart)]
    [HttpPost("{id:guid}/part/{partId:guid}/return")]
    public async Task<IActionResult> ReturnPart(Guid id, Guid partId, [FromBody] ReturnRepairPartCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId || partId != command.RepairPartId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Hoàn trả linh kiện thành công"));
    }

    /// <summary>
    /// API Ghi nhận hỏng/mất linh kiện (Write-Off).
    /// POST: /api/RepairTicket/{id}/part/{partId}/writeoff
    /// </summary>
    [Authorize(Policy = Permissions.Repair.WriteOffPart)]
    [HttpPost("{id:guid}/part/{partId:guid}/writeoff")]
    public async Task<IActionResult> WriteOffPart(Guid id, Guid partId, [FromBody] WriteOffRepairPartCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId || partId != command.RepairPartId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Ghi nhận Write-Off linh kiện thành công"));
    }

    /// <summary>
    /// API Hủy phiếu sửa chữa kèm quyết định xử lý linh kiện (Cancel with Dispositions).
    /// POST: /api/RepairTicket/{id}/cancel
    /// </summary>
    [Authorize(Policy = Permissions.Repair.Cancel)]
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelTicket(Guid id, [FromBody] CancelRepairTicketCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Hủy phiếu sửa chữa thành công"));
    }

    /// <summary>
    /// API Phân công kỹ thuật viên phụ trách sửa chữa (Section 7).
    /// POST: /api/RepairTicket/{id}/assign-technician
    /// </summary>
    [Authorize(Policy = Permissions.Repair.Update)]
    [HttpPost("{id:guid}/assign-technician")]
    public async Task<IActionResult> AssignTechnician(Guid id, [FromBody] AssignTechnicianCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Phân công kỹ thuật viên thành công"));
    }

    /// <summary>
    /// API Bắt đầu chẩn đoán thiết bị (Section 5: Received -> Diagnosing).
    /// POST: /api/RepairTicket/{id}/start-diagnosis
    /// </summary>
    [Authorize(Policy = Permissions.Repair.Diagnose)]
    [HttpPost("{id:guid}/start-diagnosis")]
    public async Task<IActionResult> StartDiagnosis(Guid id, CancellationToken cancellationToken)
    {
        var command = new StartDiagnosisCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Bắt đầu chẩn đoán thiết bị"));
    }

    /// <summary>
    /// API Nộp kết quả chẩn đoán và phương án sửa chữa (Section 5).
    /// POST: /api/RepairTicket/{id}/submit-diagnosis
    /// </summary>
    [Authorize(Policy = Permissions.Repair.Diagnose)]
    [HttpPost("{id:guid}/submit-diagnosis")]
    public async Task<IActionResult> SubmitDiagnosis(Guid id, [FromBody] SubmitDiagnosisCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Ghi nhận kết quả chẩn đoán thành công"));
    }

    /// <summary>
    /// API Khách hàng phê duyệt phương án & báo giá sửa chữa (Section 6: WaitingApproval -> Repairing).
    /// POST: /api/RepairTicket/{id}/approve
    /// </summary>
    [Authorize(Roles = $"{CanonicalRoles.Owner},{CanonicalRoles.Admin},{CanonicalRoles.Manager},{CanonicalRoles.Technician},{CanonicalRoles.Sales}")]
    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> ApproveRepair(Guid id, [FromBody] ApproveRepairCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Xác nhận khách hàng đồng ý sửa chữa"));
    }

    /// <summary>
    /// API Khách hàng từ chối sửa chữa (Section 6: WaitingApproval -> Cancelled).
    /// POST: /api/RepairTicket/{id}/reject
    /// </summary>
    [Authorize(Policy = Permissions.Repair.Cancel)]
    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> RejectRepair(Guid id, [FromBody] RejectRepairCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Ghi nhận khách hàng từ chối sửa chữa"));
    }

    /// <summary>
    /// API Lắp ráp linh kiện vào máy (Section 8: Reserved/Issued -> Installed).
    /// POST: /api/RepairTicket/{id}/parts/{partId}/use
    /// </summary>
    [Authorize(Policy = Permissions.Repair.UpdatePart)]
    [HttpPost("{id:guid}/parts/{partId:guid}/use")]
    public async Task<IActionResult> UseRepairPart(Guid id, Guid partId, [FromBody] UseRepairPartCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId || partId != command.RepairPartId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Lắp ráp linh kiện vào máy thành công"));
    }

    /// <summary>
    /// API Hoàn tất sửa chữa (Section 11: WaitingQC/Repairing -> Completed).
    /// POST: /api/RepairTicket/{id}/complete
    /// </summary>
    [Authorize(Policy = Permissions.Repair.Update)]
    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> CompleteRepair(Guid id, [FromBody] CompleteRepairCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Hoàn tất sửa chữa thiết bị thành công"));
    }

    /// <summary>
    /// API Bàn giao thiết bị cho khách hàng (Section 12: Completed/WaitingPickup -> Delivered).
    /// POST: /api/RepairTicket/{id}/deliver
    /// </summary>
    [Authorize(Roles = $"{CanonicalRoles.Owner},{CanonicalRoles.Admin},{CanonicalRoles.Manager},{CanonicalRoles.Technician},{CanonicalRoles.Sales}")]
    [HttpPost("{id:guid}/deliver")]
    public async Task<IActionResult> DeliverRepair(Guid id, [FromBody] DeliverRepairCommand command, CancellationToken cancellationToken)
    {
        if (id != command.RepairTicketId)
            return BadRequest(ApiResponse<bool>.Fail("SYS_002", "Id trong URL và body không khớp."));

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Bàn giao máy cho khách hàng thành công"));
    }
}

