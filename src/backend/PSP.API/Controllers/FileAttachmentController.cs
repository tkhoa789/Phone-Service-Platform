using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Interfaces;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Notification.Commands;
using PSP.Application.Modules.Notification.DTOs;
using PSP.Application.Modules.Notification.Queries;
using PSP.Domain.Modules.Notification.Entities;

namespace PSP.API.Controllers;

[Authorize]
[Route("api/[controller]")]
[Tags("FileAttachments")]
public class FileAttachmentController : BaseApiController
{
    private static readonly HashSet<string> PublicEntityWhitelist = new(StringComparer.OrdinalIgnoreCase)
    {
        "SystemLogo",
        "Product",
        "ProductVariant"
    };
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
    /// Cổng tải tệp công khai (Chỉ dành cho Logo hệ thống và Ảnh Sản phẩm).
    /// GET: /api/FileAttachment/public/{id}/download
    /// </summary>
    [HttpGet("public/{id:guid}/download")]
    [AllowAnonymous]
    public async Task<IActionResult> DownloadPublic(
        Guid id,
        [FromServices] IRepository<FileAttachmentEntity> attachmentRepo,
        [FromServices] Microsoft.AspNetCore.Hosting.IWebHostEnvironment env,
        CancellationToken cancellationToken)
    {
        var attachment = await attachmentRepo.GetByIdAsNoTrackingAsync(id, cancellationToken);
        if (attachment == null)
        {
            return ServeTransparentFallbackOrNotFound(null);
        }

        // 🔒 CHỐT CHẶN PHÂN QUYỀN: Cấm tuyệt đối tải file nội bộ (RepairTicket, SalesOrder...) qua cổng public
        if (!PublicEntityWhitelist.Contains(attachment.EntityName))
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse<bool>.Fail("FORBIDDEN_ENTITY", "Tệp này thuộc danh mục bảo mật nội bộ, không được phép tải qua cổng công cộng."));
        }

        return ServePhysicalFileSecured(attachment, env);
    }

    /// <summary>
    /// Cổng tải tệp nội bộ bảo mật (Hỗ trợ Dual-Auth: Bearer JWT hoặc HMAC Pre-signed URL).
    /// GET: /api/FileAttachment/{id}/download?expires={ts}&sig={hex}
    /// </summary>
    [HttpGet("{id:guid}/download")]
    [AllowAnonymous] // Bắt buộc AllowAnonymous ở cấp Action để thẻ <img> không bị chặn bởi Class AuthorizeFilter
    public async Task<IActionResult> Download(
        Guid id,
        [FromQuery] long? expires,
        [FromQuery] string? sig,
        [FromServices] IRepository<FileAttachmentEntity> attachmentRepo,
        [FromServices] IHmacTokenService hmacService,
        [FromServices] Microsoft.AspNetCore.Hosting.IWebHostEnvironment env,
        CancellationToken cancellationToken)
    {
        var attachment = await attachmentRepo.GetByIdAsNoTrackingAsync(id, cancellationToken);
        if (attachment == null)
        {
            return ServeTransparentFallbackOrNotFound(null);
        }

        // 🔒 CHỐT CHẶN DUAL-AUTH:
        bool hasValidBearer = User.Identity?.IsAuthenticated == true;
        bool hasValidHmac = expires.HasValue && !string.IsNullOrWhiteSpace(sig) && 
                            hmacService.ValidateSignature(id, expires.Value, sig);

        if (!hasValidBearer && !hasValidHmac)
        {
            // 🛡️ CHỐT CHẶN TƯƠNG THÍCH NGƯỢC (BẢO VỆ SIDEBAR LOGO & ẢNH SẢN PHẨM):
            // Nếu là tệp công khai (SystemLogo, Product), cho phép pass-through để không làm kích hoạt
            // hook onError trong Sidebar.tsx và SystemSettingsPage.tsx của người dùng cũ.
            if (!PublicEntityWhitelist.Contains(attachment.EntityName))
            {
                return StatusCode(StatusCodes.Status401Unauthorized,
                    ApiResponse<bool>.Fail("UNAUTHORIZED", "Yêu cầu Bearer Token hoặc Pre-signed URL hợp lệ để truy cập tệp nội bộ."));
            }
        }

        return ServePhysicalFileSecured(attachment, env);
    }

    /// <summary>
    /// API tạo Pre-signed URL có chữ ký HMAC SHA256 cho tệp đính kèm nội bộ (thời hạn 30 phút).
    /// GET: /api/FileAttachment/{id}/signed-url
    /// </summary>
    [HttpGet("{id:guid}/signed-url")]
    public async Task<IActionResult> GetSignedUrl(
        Guid id,
        [FromServices] IRepository<FileAttachmentEntity> attachmentRepo,
        [FromServices] IHmacTokenService hmacService,
        CancellationToken cancellationToken)
    {
        var attachment = await attachmentRepo.GetByIdAsNoTrackingAsync(id, cancellationToken);
        if (attachment == null)
        {
            return NotFound(ApiResponse<bool>.Fail("NOT_FOUND", "Không tìm thấy tệp đính kèm."));
        }

        // Tệp công khai: Trả về thẳng đường dẫn public, không tốn tài nguyên ký HMAC
        if (PublicEntityWhitelist.Contains(attachment.EntityName))
        {
            return Ok(ApiResponse<object>.Success(new
            {
                fileId = id,
                url = $"/api/FileAttachment/public/{id}/download",
                isPublic = true
            }, "Lấy liên kết tải tệp thành công."));
        }

        var signedUrl = hmacService.GeneratePreSignedUrl(id, TimeSpan.FromMinutes(30));
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeSeconds();

        return Ok(ApiResponse<object>.Success(new
        {
            fileId = id,
            url = signedUrl,
            isPublic = false,
            expiresAt
        }, "Tạo Pre-signed URL thành công."));
    }

    /// <summary>
    /// Phục vụ tệp vật lý an toàn: Candidate Paths + Canonical Path Verification + OWASP Headers
    /// </summary>
    private IActionResult ServePhysicalFileSecured(FileAttachmentEntity attachment, Microsoft.AspNetCore.Hosting.IWebHostEnvironment env)
    {
        string relativePath = attachment.FilePath.TrimStart('/', '\\');
        string? absolutePath = null;

        // 🛡️ CHỐT CHẶN TỬ HUYỆT 3: Duyệt toàn bộ danh sách 6 candidate paths để không mất ảnh demo trong start-dev.bat
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
            return ServeTransparentFallbackOrNotFound(attachment);
        }

        // 🛡️ BẢO MẬT CANONICAL PATH: Bắt buộc đường dẫn tuyệt đối cuối cùng phải nằm trong thư mục uploads
        var canonicalPath = Path.GetFullPath(absolutePath);
        if (!canonicalPath.Contains(Path.DirectorySeparatorChar + "uploads" + Path.DirectorySeparatorChar) &&
            !canonicalPath.EndsWith(Path.DirectorySeparatorChar + "uploads") &&
            !canonicalPath.Contains("/uploads/"))
        {
            return BadRequest(ApiResponse<bool>.Fail("SECURITY_VIOLATION", "Phát hiện truy cập ngoài thư mục uploads an toàn."));
        }

        // 🛡️ TIÊM BỘ 4 OWASP SECURITY HEADERS
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Content-Security-Policy"] = "default-src 'none'; sandbox";
        Response.Headers["X-Frame-Options"] = "DENY";

        var sanitizedFileName = Path.GetFileName(attachment.FilePath).Replace("\"", string.Empty);
        Response.Headers["Content-Disposition"] = $"inline; filename=\"{sanitizedFileName}\"; filename*=UTF-8''{Uri.EscapeDataString(sanitizedFileName)}";

        var contentType = attachment.FileType ?? "application/octet-stream";
        if (contentType == "application/octet-stream")
        {
            var ext = Path.GetExtension(canonicalPath).ToLowerInvariant();
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

        return PhysicalFile(canonicalPath, contentType, enableRangeProcessing: true);
    }

    private IActionResult ServeTransparentFallbackOrNotFound(FileAttachmentEntity? attachment)
    {
        var accept = Request.Headers["Accept"].ToString();
        if (accept.Contains("image", StringComparison.OrdinalIgnoreCase) || 
            attachment?.FileType?.StartsWith("image/") == true ||
            attachment?.EntityName == "SystemLogo" ||
            Request.Path.Value?.EndsWith("/download") == true)
        {
            byte[] transparentPng = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
            return File(transparentPng, "image/png");
        }
        return NotFound(ApiResponse<bool>.Fail("NOT_FOUND", "Không tìm thấy tệp đính kèm vật lý trên máy chủ."));
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
