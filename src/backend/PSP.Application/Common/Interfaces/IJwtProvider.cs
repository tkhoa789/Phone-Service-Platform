using PSP.Domain.Modules.Auth.Entities;

namespace PSP.Application.Common.Interfaces;

public interface IJwtProvider
{
    string GenerateToken(UserEntity user, IList<string> roles, IList<string> permissions);
    string GenerateRefreshToken();
}
