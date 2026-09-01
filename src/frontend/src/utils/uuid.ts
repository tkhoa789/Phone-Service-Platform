/**
 * Safely generates a UUID v4.
 * Falls back to Math.random when running in a non-secure context (e.g. LAN HTTP http://192.168.x.x:3000)
 * where crypto.randomUUID is not available in modern browsers.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
