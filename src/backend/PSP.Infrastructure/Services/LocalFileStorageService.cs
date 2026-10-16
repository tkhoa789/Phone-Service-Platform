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
        var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var absolutePath = Path.Combine(webRootPath, filePath.TrimStart('/'));
        if (File.Exists(absolutePath))
        {
            File.Delete(absolutePath);
        }
        return Task.CompletedTask;
    }
}
