import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Formats a Date ISO string to 'dd/MM/yyyy HH:mm'.
 */
export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return format(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Formats a Date ISO string to short date 'dd/MM/yyyy'.
 */
export function formatDateShort(dateStr: string | Date): string {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return format(date, 'dd/MM/yyyy');
}

/**
 * Formats date relatively in Vietnamese (e.g. "khoảng 3 phút trước").
 */
export function formatRelative(dateStr: string | Date): string {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return formatDistanceToNow(date, { addSuffix: true, locale: vi });
}
