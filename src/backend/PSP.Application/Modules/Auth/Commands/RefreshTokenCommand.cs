using MediatR;
using PSP.Application.Modules.Auth.DTOs;

namespace PSP.Application.Modules.Auth.Commands;

/// <summary>
/// =====================================================================
/// LỆNH LÀM MỚI TOKEN (RefreshTokenCommand)
/// =====================================================================
/// 
/// KỊCH BẢN SỬ DỤNG:
/// ------------------
/// 1. Nhân viên đang làm việc trên hệ thống.
/// 2. Sau 60 phút, Access Token hết hạn.
/// 3. Thay vì bắt nhân viên phải nhập lại mật khẩu (rất phiền),
///    Frontend tự động gửi Refresh Token lên API này.
/// 4. Server kiểm tra Refresh Token hợp lệ → Cấp cặp Token mới.
/// 5. Nhân viên tiếp tục làm việc mà không bị gián đoạn.
///
/// BẢO MẬT - TOKEN ROTATION (Xoay vòng Token):
/// ---------------------------------------------
/// Mỗi lần làm mới, server sẽ:
///   - Thu hồi Refresh Token CŨ (không dùng lại được).
///   - Cấp Refresh Token MỚI hoàn toàn.
/// → Nếu hacker lỡ đánh cắp được Refresh Token cũ, nó đã bị vô hiệu hóa rồi.
/// =====================================================================
/// </summary>
public record RefreshTokenCommand(string RefreshToken) : IRequest<AuthResponseDto>;
