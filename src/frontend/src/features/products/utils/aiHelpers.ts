// Mock AI and Local DB helpers ported directly from FE-3.4 legacy code to preserve functionality.
// TODO: This should be eventually handled by backend AI services.

export const LOCAL_BARCODE_DB: Record<string, { brandName: string; catName: string; code: string; modelName: string }> = {
  '1942': { brandName: 'Apple', catName: 'Điện thoại', code: 'IP16PROMAX', modelName: 'iPhone 16 Pro Max' },
  '1959': { brandName: 'Apple', catName: 'Máy tính bảng', code: 'IPADPRO13', modelName: 'iPad Pro 13 M4' },
  '8806': { brandName: 'Samsung', catName: 'Điện thoại', code: 'S25ULTRA', modelName: 'Samsung Galaxy S25 Ultra' },
  '6900': { brandName: 'Xiaomi', catName: 'Điện thoại', code: 'XM15PRO', modelName: 'Xiaomi 15 Pro' },
  '6934': { brandName: 'OPPO', catName: 'Điện thoại', code: 'FINDX8', modelName: 'OPPO Find X8 Pro' },
};

export const OLLAMA_QDRANT_KNOWLEDGE_DB: Record<string, { brandName: string; catName: string; code: string; modelName: string }> = {
  '4549': { brandName: 'Nintendo', catName: 'Máy chơi game', code: 'NSW_OLED', modelName: 'Nintendo Switch OLED White' },
  '0885': { brandName: 'Sony', catName: 'Tai nghe', code: 'WH1000XM5', modelName: 'Sony WH-1000XM5 Noise Canceling' },
  '4948': { brandName: 'Sony', catName: 'Máy chơi game', code: 'PS5_SLIM', modelName: 'PlayStation 5 Slim Edition' },
  '0840': { brandName: 'Google', catName: 'Điện thoại', code: 'PIXEL9PRO', modelName: 'Google Pixel 9 Pro Fold' },
  '4711': { brandName: 'ASUS', catName: 'Điện thoại', code: 'ROG9PRO', modelName: 'ASUS ROG Phone 9 Pro' },
  '7613': { brandName: 'Garmin', catName: 'Đồng hồ thông minh', code: 'FENIX8', modelName: 'Garmin Fenix 8 Solar Edition' },
};

export function lookupProductByBarcode(barcode: string) {
  if (LOCAL_BARCODE_DB[barcode]) {
    return { source: 'LOCAL', data: LOCAL_BARCODE_DB[barcode] };
  }
  if (OLLAMA_QDRANT_KNOWLEDGE_DB[barcode]) {
    return { source: 'AI_KNOWLEDGE', data: OLLAMA_QDRANT_KNOWLEDGE_DB[barcode] };
  }
  return null;
}
