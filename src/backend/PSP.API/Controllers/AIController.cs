using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Modules.AI.Commands;
using PSP.Application.Modules.AI.DTOs;
using PSP.Application.Modules.AI.Queries;
using PSP.Domain.Common.Constants;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PSP.API.Controllers;

/// <summary>
/// BỘ ĐIỀU HƯỚNG TRỢ LÝ AI (AIController)
/// </summary>
[Authorize(Policy = Permissions.AI.Chat)]
public class AIController : BaseApiController
{
    /// <summary>
    /// API TRÒ CHUYỆN VỚI TRỢ LÝ AI (Gồm cả RAG và Lịch sử chat)
    /// Đường dẫn: POST /api/AI/chat
    /// </summary>
    /// <param name="dto">Dữ liệu câu hỏi và mã cuộc trò chuyện.</param>
    /// <returns>Trả về câu trả lời từ AI và ID phòng chat.</returns>
    [HttpPost("chat")]
    public async Task<ActionResult<AIChatResponseDto>> Chat([FromBody] AIChatRequestDto dto)
    {
        var result = await Mediator.Send(new SendAIMessageCommand(dto.ConversationId, dto.Message));
        return Ok(result);
    }

    /// <summary>
    /// API TRÒ CHUYỆN VỚI TRỢ LÝ AI (Nhận kết quả Streaming)
    /// Đường dẫn: POST /api/AI/chat-stream
    /// </summary>
    [HttpPost("chat-stream")]
    public async Task ChatStream([FromBody] AIChatRequestDto dto)
    {
        Response.Headers.Append("Content-Type", "text/event-stream");
        
        var stream = Mediator.CreateStream(new SendAIMessageStreamCommand(dto.ConversationId, dto.Message));
        
        await foreach (var chunk in stream)
        {
            var json = System.Text.Json.JsonSerializer.Serialize(new { content = chunk });
            await Response.WriteAsync($"data: {json}\n\n");
            await Response.Body.FlushAsync();
        }
    }

    /// <summary>
    /// API NẠP TRI THỨC VĂN BẢN (AI.ANALYTICS - Owner, Admin, Manager)
    /// Đường dẫn: POST /api/AI/ingest
    /// </summary>
    /// <param name="command">Chứa Tiêu đề, Nội dung chính sách, Phân loại.</param>
    /// <returns>Trả về true nếu nạp thành công.</returns>
    [HttpPost("ingest")]
    [Authorize(Policy = Permissions.AI.Analytics)]
    public async Task<ActionResult<bool>> Ingest([FromBody] IngestKnowledgeDocumentCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// API LẤY LỊCH SỬ DANH SÁCH PHÒNG CHAT CỦA USER ĐANG ĐĂNG NHẬP
    /// Đường dẫn: GET /api/AI/conversations
    /// </summary>
    [HttpGet("conversations")]
    public async Task<ActionResult<List<AIConversationDto>>> GetConversations()
    {
        var result = await Mediator.Send(new GetAIConversationsQuery());
        return Ok(result);
    }

    /// <summary>
    /// API LẤY CHI TIẾT CÁC TIN NHẮN TRONG MỘT PHÒNG CHAT CỤ THỂ
    /// Đường dẫn: GET /api/AI/conversations/{id}
    /// </summary>
    /// <param name="id">Mã định danh cuộc hội thoại.</param>
    [HttpGet("conversations/{id}")]
    public async Task<ActionResult<List<AIMessageDto>>> GetConversationDetail(Guid id)
    {
        var result = await Mediator.Send(new GetAIConversationDetailQuery(id));
        return Ok(result);
    }
}
