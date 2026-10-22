using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Moq;
using PSP.Infrastructure.Services;
using Xunit;

namespace PSP.Infrastructure.Tests;

public class LocalFileStorageServiceTests
{
    private readonly Mock<IWebHostEnvironment> _mockEnv;
    private readonly LocalFileStorageService _service;

    public LocalFileStorageServiceTests()
    {
        _mockEnv = new Mock<IWebHostEnvironment>();
        // Use the current directory as fake WebRootPath for testing
        _mockEnv.Setup(e => e.WebRootPath).Returns(Directory.GetCurrentDirectory());
        _service = new LocalFileStorageService(_mockEnv.Object);
    }

    [Theory]
    [InlineData("test.exe")]
    [InlineData("script.sh")]
    [InlineData("shell.php")]
    [InlineData("malicious.aspx")]
    public async Task UploadFileAsync_WithInvalidExtension_ThrowsArgumentException(string fileName)
    {
        // Arrange
        using var stream = new MemoryStream(new byte[] { 1, 2, 3 });

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            _service.UploadFileAsync(stream, fileName, "application/octet-stream", CancellationToken.None));
    }

    [Theory]
    [InlineData("image.png")]
    [InlineData("document.pdf")]
    [InlineData("data.xlsx")]
    public async Task UploadFileAsync_WithValidExtension_Succeeds(string fileName)
    {
        // Arrange
        using var stream = new MemoryStream(new byte[] { 1, 2, 3 });

        // Act
        var result = await _service.UploadFileAsync(stream, fileName, "application/octet-stream", CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.StartsWith("/uploads/", result);
        var expectedExtension = Path.GetExtension(fileName).ToLowerInvariant();
        Assert.EndsWith(expectedExtension, result);

        // Clean up the created file
        var filePath = Path.Combine(Directory.GetCurrentDirectory(), result.TrimStart('/'));
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }

    [Theory]
    [InlineData("../../appsettings.json")]
    [InlineData("../../../etc/passwd")]
    [InlineData("..\\..\\Windows\\System32\\cmd.exe")]
    public async Task DeleteFileAsync_WithPathTraversal_ThrowsSecurityException(string maliciousPath)
    {
        // Act & Assert
        await Assert.ThrowsAsync<System.Security.SecurityException>(() =>
            _service.DeleteFileAsync(maliciousPath, CancellationToken.None));
    }

    [Fact]
    public async Task DeleteFileAsync_WithValidPathInsideUploads_DeletesFile()
    {
        // Arrange
        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        if (!Directory.Exists(uploadsDir))
        {
            Directory.CreateDirectory(uploadsDir);
        }

        var fileName = $"test-delete-{Guid.NewGuid():N}.png";
        var fullPath = Path.Combine(uploadsDir, fileName);
        await File.WriteAllTextAsync(fullPath, "dummy content");
        Assert.True(File.Exists(fullPath));

        // Act
        await _service.DeleteFileAsync($"/uploads/{fileName}", CancellationToken.None);

        // Assert
        Assert.False(File.Exists(fullPath));
    }
}
