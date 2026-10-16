namespace PSP.Application.Common.Interfaces;

public interface IIdempotencyService
{
    void SetCurrentRequest(string identityKey, string requestHash);
    void AttachRecord(object responseDto);
    string? GetAttachedRecordBody();
}
