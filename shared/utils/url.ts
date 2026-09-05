/**
 * URL sanitization and normalization utilities for Harbor plugins.
 */

/**
 * Ensures an image or link URL is an absolute http(s) URL.
 * Harbor drops any cover, page image, or siteUrl that is not an absolute HTTP(S) URL.
 *
 * @param baseUrl The base domain/origin of the source site (e.g. "https://example.com")
 * @param url The target URL candidate (can be relative, protocol-relative, or absolute)
 * @returns Absolute URL string or undefined if invalid
 */
export function abs(baseUrl: string, url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // Already absolute http(s)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Protocol relative
  if (trimmed.startsWith('//')) {
    return 'https:' + trimmed;
  }

  const baseClean = baseUrl.replace(/\/+$/, '');
  const pathClean = trimmed.replace(/^\/+/, '');

  return `${baseClean}/${pathClean}`;
}

/**
 * Creates a source-specific abs() helper bound to a base URL.
 */
export function createUrlResolver(baseUrl: string) {
  return (url?: string | null) => abs(baseUrl, url);
}
