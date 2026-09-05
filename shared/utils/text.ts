/**
 * Text and metadata cleanup utilities for Harbor plugins.
 */

/**
 * Normalizes title string by stripping rogue punctuation, source suffixes, and excess whitespace.
 * Compatible with Harbor's AniList, Google Books, and OpenLibrary title matching algorithms.
 */
export function cleanTitle(value?: string | null): string {
  return (value || '')
    .replace(/[^\p{L}\p{N}'’]+/gu, ' ')
    .replace(/\s+(?:kol|كول)$/iu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates 1-based page number from 0-based offset.
 * Standard Harbor page size is 48 items.
 */
export function calcPage(offset: number, pageSize: number = 48): number {
  return Math.floor(Math.max(0, offset) / pageSize) + 1;
}

/**
 * Safely parses numeric values from text or attributes.
 */
export function parseNumber(value?: string | number | null): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return isNaN(value) ? undefined : value;
  const cleaned = value.replace(/,/g, '').trim();
  const num = Number(cleaned);
  return isNaN(num) ? undefined : num;
}
