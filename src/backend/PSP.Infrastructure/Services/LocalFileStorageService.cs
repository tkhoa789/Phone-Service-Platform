using Microsoft.AspNetCore.Hosting;
using PSP.Application.Common.Interfaces;

namespace PSP.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;

    public LocalFileStorageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken)
    {
        var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsFolder = Path.Combine(webRootPath, "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt" };
        if (!allowedExtensions.Contains(extension))
        {
            throw new ArgumentException("File extension is not allowed.");
        }

        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var fileStreamOutput = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(fileStreamOutput, cancellationToken);
        }

        return $"/uploads/{uniqueFileName}";
    }

    public Task DeleteFileAsync(string filePath, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(filePath))
        {
            return Task.CompletedTask;
        }

        var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsFolder = Path.GetFullPath(Path.Combine(webRootPath, "uploads"));

        // 1. Giải quyết đường dẫn chính tắc (Canonical Path)
        var normalizedSubPath = filePath.TrimStart('/', '\\');
        var rawFullPath = Path.Combine(webRootPath, normalizedSubPath);
        var canonicalFullPath = Path.GetFullPath(rawFullPath);

        // 2. Chốt chặn tiền tố: Bắt buộc phải nằm trong thư mục uploads/
        var uploadsPrefix = uploadsFolder.EndsWith(Path.DirectorySeparatorChar)
            ? uploadsFolder
            : uploadsFolder + Path.DirectorySeparatorChar;

        if (!canonicalFullPath.StartsWith(uploadsPrefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new System.Security.SecurityException(
                $"[SECURITY ALERT] Phát hiện hành vi leo thang thư mục (Path Traversal)! Đường dẫn '{filePath}' nằm ngoài vùng lưu trữ uploads an toàn.");
        }

        // 3. Tiến hành xóa an toàn khi đã được kiểm định chính tắc
        if (File.Exists(canonicalFullPath))
        {
            File.Delete(canonicalFullPath);
        }

        return Task.CompletedTask;
    }
}
