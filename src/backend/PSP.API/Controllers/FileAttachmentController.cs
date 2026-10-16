using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Notification.Commands;
using PSP.Application.Modules.Notification.DTOs;
using PSP.Application.Modules.Notification.Queries;

namespace PSP.API.Controllers;

[Authorize]
[Route("api/[controller]")]
[Tags("FileAttachments")]
public class FileAttachmentController : BaseApiController
{
    /// <summary>
    /// API Tải tệp lên liên kết với thực thể nghiệp vụ (sử dụng multipart/form-data).
    /// POST: /api/FileAttachment
    /// </summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(
        [FromForm] string entityName,
        [FromForm] Guid entityId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<Guid>.Fail("FILE_001", "Tệp gửi lên không hợp lệ hoặc trống."));
        }

        using var stream = file.OpenReadStream();
        var command = new UploadFileAttachmentCommand(
            entityName,
            entityId,
            stream,
            file.FileName,
            file.ContentType,
            file.Length
        );

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<Guid>.Success(result, "Tải tệp đính kèm lên thành công."));
    }

    /// <summary>
    /// API Lấy danh sách tệp đính kèm theo loại thực thể và ID thực thể.
    /// GET: /api/FileAttachment/{entityName}/{entityId}
    /// </summary>
    [HttpGet("{entityName}/{entityId:guid}")]
    public async Task<IActionResult> GetByEntity(string entityName, Guid entityId, CancellationToken cancellationToken)
    {
        var query = new GetFileAttachmentsByEntityQuery(entityName, entityId);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<IEnumerable<FileAttachmentDto>>.Success(result, "Lấy danh sách tệp đính kèm thành công."));
    }

    /// <summary>
    /// API Tải tệp đính kèm theo ID.
    /// GET: /api/FileAttachment/{id}/download
    /// </summary>
    [HttpGet("{id:guid}/download")]
    [AllowAnonymous]
    public async Task<IActionResult> Download(
        Guid id,
        [FromServices] PSP.Application.Common.Interfaces.IRepository<PSP.Domain.Modules.Notification.Entities.FileAttachmentEntity> attachmentRepo,
        [FromServices] Microsoft.AspNetCore.Hosting.IWebHostEnvironment env,
        CancellationToken cancellationToken)
    {
        var attachment = await attachmentRepo.GetByIdAsNoTrackingAsync(id, cancellationToken);
        if (attachment == null)
        {
            var acceptHeader = Request.Headers["Accept"].ToString();
            if (acceptHeader.Contains("image", StringComparison.OrdinalIgnoreCase) || Request.Path.Value?.EndsWith("/download") == true)
            {
                byte[] transparentPng = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
                return File(transparentPng, "image/png");
            }
            return NotFound(ApiResponse<bool>.Fail("NOT_FOUND", "Không tìm thấy tệp đính kèm."));
        }

        string relativePath = attachment.FilePath.TrimStart('/', '\\');
        string? absolutePath = null;

        var candidatePaths = new List<string?>
        {
            !string.IsNullOrEmpty(env.WebRootPath) ? Path.Combine(env.WebRootPath, relativePath) : null,
            !string.IsNullOrEmpty(env.ContentRootPath) ? Path.Combine(env.ContentRootPath, "wwwroot", relativePath) : null,
            Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath),
            Path.Combine(Directory.GetCurrentDirectory(), "src", "backend", "PSP.API", "wwwroot", relativePath),
            Path.Combine(AppContext.BaseDirectory, "wwwroot", relativePath),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "wwwroot", relativePath)
        };

        foreach (var candidate in candidatePaths)
        {
            if (!string.IsNullOrEmpty(candidate) && System.IO.File.Exists(candidate))
            {
                absolutePath = Path.GetFullPath(candidate);
                break;
            }
        }

        if (string.IsNullOrEmpty(absolutePath) || !System.IO.File.Exists(absolutePath))
        {
            var accept = Request.Headers["Accept"].ToString();
            if (accept.Contains("image", StringComparison.OrdinalIgnoreCase) || 
                attachment.FileType?.StartsWith("image/") == true ||
                attachment.EntityName == "SystemLogo" ||
                attachment.FilePath.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
                attachment.FilePath.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
                attachment.FilePath.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase) ||
                attachment.FilePath.EndsWith(".webp", StringComparison.OrdinalIgnoreCase))
            {
                byte[] transparentPng = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
                return File(transparentPng, "image/png");
            }
            return NotFound(ApiResponse<bool>.Fail("NOT_FOUND", "Tệp vật lý không tồn tại trên máy chủ."));
        }

        var contentType = attachment.FileType ?? "application/octet-stream";
        if (contentType == "application/octet-stream")
        {
            var ext = Path.GetExtension(absolutePath).ToLowerInvariant();
            contentType = ext switch
            {
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".webp" => "image/webp",
                ".svg" => "image/svg+xml",
                ".gif" => "image/gif",
                ".pdf" => "application/pdf",
                _ => "application/octet-stream"
            };
        }

        return PhysicalFile(absolutePath, contentType, enableRangeProcessing: true);
    }

    /// <summary>
    /// API Xóa tệp đính kèm theo ID (xóa file vật lý + xóa database).
    /// DELETE: /api/FileAttachment/{id}
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteFileAttachmentCommand(id);
        var result = await Mediator.Send(command, cancellationToken);
        if (!result)
        {
            return NotFound(ApiResponse<bool>.Fail("NOT_FOUND", "Không tìm thấy tệp đính kèm cần xóa."));
        }
        return Ok(ApiResponse<bool>.Success(result, "Xóa tệp đính kèm thành công."));
    }
}
