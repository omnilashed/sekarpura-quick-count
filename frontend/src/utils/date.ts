/**
 * Date and Time utilities for SEKARPURA Election Center (Frontend)
 * Standardized to UTC+7 (Asia/Jakarta / Waktu Indonesia Barat - WIB)
 */

export function toDateObj(date?: Date | string | number): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  return new Date(date);
}

/**
 * Returns formatted Date and Time in WIB (UTC+7)
 * Example: "20 November 2026, 22:04:56 WIB"
 */
export function formatWibDateTime(date?: Date | string | number): string {
  const d = toDateObj(date);
  const datePart = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);

  const timePart = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(d)
    .replace(/\./g, ':');

  return `${datePart}, ${timePart} WIB`;
}

/**
 * Returns compact Date and Time in WIB (UTC+7)
 * Example: "20/11/2026 22:04 WIB"
 */
export function formatWibShortDateTime(date?: Date | string | number): string {
  const d = toDateObj(date);
  const datePart = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);

  const timePart = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(d)
    .replace(/\./g, ':');

  return `${datePart} ${timePart} WIB`;
}

/**
 * Returns formal Date in WIB (UTC+7)
 * Example: "20 November 2026"
 */
export function formatWibDate(date?: Date | string | number): string {
  const d = toDateObj(date);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Returns Time string in WIB (UTC+7)
 * Example: "22:04 WIB" or "22:04:56 WIB"
 */
export function formatWibTime(
  date?: Date | string | number,
  includeSeconds: boolean = false
): string {
  const d = toDateObj(date);
  const timePart = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
    hour12: false,
  })
    .format(d)
    .replace(/\./g, ':');

  return `${timePart} WIB`;
}

/**
 * Generates filename-safe timestamp in WIB (UTC+7)
 * Example: "2026-11-20_22-04-56-WIB"
 */
export function getWibFilenameTimestamp(date?: Date | string | number): string {
  const d = toDateObj(date);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
  return `${get('year')}-${get('month')}-${get('day')}_${get('hour')}-${get('minute')}-${get('second')}-WIB`;
}
