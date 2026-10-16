namespace PSP.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken);
    Task DeleteFileAsync(string filePath, CancellationToken cancellationToken);
}
