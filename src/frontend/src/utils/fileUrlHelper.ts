import { axiosClient } from './axiosClient';

interface CachedSignedUrl {
  url: string;
  expiresAt: number;
}

const signedUrlCache = new Map<string, CachedSignedUrl>();

/**
 * Trả về URL tải tệp an toàn:
 * - File công khai (Logo, Sản phẩm): Trỏ thẳng sang endpoint public không cần token.
 * - File nhạy cảm (Phiếu sửa chữa, CCCD, đơn hàng): Lấy hoặc tái sử dụng Pre-signed URL từ cache (TTL 30m).
 */
export async function getFileDownloadUrl(fileId: string, isPublic = false): Promise<string> {
  if (!fileId) return '';

  if (isPublic) {
    return `/api/FileAttachment/public/${fileId}/download`;
  }

  const now = Math.floor(Date.now() / 1000);
  const cached = signedUrlCache.get(fileId);

  // Tái sử dụng URL đã ký nếu còn hạn trên 3 phút (180 giây)
  if (cached && cached.expiresAt - now > 180) {
    return cached.url;
  }

  try {
    const res = await axiosClient.get(`/FileAttachment/${fileId}/signed-url`);
    const data = res.data?.data;
    if (data?.url) {
      if (!data.isPublic && data.expiresAt) {
        signedUrlCache.set(fileId, {
          url: data.url,
          expiresAt: data.expiresAt,
        });
      }
      return data.url;
    }
  } catch {
    // Fallback an toàn nếu có gián đoạn mạng
  }

  return `/api/FileAttachment/${fileId}/download`;
}
