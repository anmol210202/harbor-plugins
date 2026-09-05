import type { EBookChapter, EBookProvider, EBookSummary, EBookTag } from '../../../shared/types/ebook.js';
import { unzipSync, strFromU8 } from 'fflate';

const MIRROR_DOMAINS = [
  'https://libgen.li',
  'https://libgen.vg',
  'https://libgen.la',
  'https://libgen.gl',
];

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const HEADERS: Record<string, string> = {
  'User-Agent': USER_AGENT,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cookie': 'covers=on',
};

// In-memory chapter & prose cache for instant sub-millisecond reader retrieval
const bookChaptersCache = new Map<string, EBookChapter[]>();
const chapterTextCache = new Map<string, string>();

// Configurable VPS Docker Proxy URL (e.g., 'https://books.yourname.duckdns.org')
// If set, requests are proxied and cached by your VPS with sub-10ms response times.
// If left empty or if offline, the plugin automatically falls back to in-app direct unpacking.
export const PROXY_SERVER_URL = 'https://harbor-books.myvpslab.duckdns.org';

/**
 * Safe network requester using Harbor host bridge
 */
async function harborRequest(
  url: string,
  responseType: 'text' | 'base64',
  headers: Record<string, string> = HEADERS
): Promise<string> {
  if (typeof harbor !== 'undefined' && harbor.http) {
    const res = await harbor.http(url, {
      responseType,
      headers,
      allowReferer: url,
      allowCookie: url,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return res.body;
  }

  // Fallback for standalone/mock environments
  const fallbackFetcher = (globalThis as any)['fetch'];
  if (fallbackFetcher) {
    const res = await fallbackFetcher(url, { headers, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    if (responseType === 'base64') {
      const ab = await res.arrayBuffer();
      const u8 = new Uint8Array(ab);
      let binary = '';
      const chunk = 8192;
      for (let i = 0; i < u8.length; i += chunk) {
        binary += String.fromCharCode.apply(null, u8.subarray(i, i + chunk) as unknown as number[]);
      }
      return btoa(binary);
    }
    return await res.text();
  }

  throw new Error('No HTTP client available in Harbor scope');
}

async function fetchText(url: string, headers: Record<string, string> = HEADERS): Promise<string> {
  return harborRequest(url, 'text', headers);
}

async function fetchBinary(url: string, headers: Record<string, string> = HEADERS): Promise<Uint8Array> {
  const base64Str = await harborRequest(url, 'base64', headers);
  const binary = atob(base64Str);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Executes a request across multiple LibGen mirror domains with automatic fallback
 */
async function fetchFromMirrors(pathWithQuery: string): Promise<{ text: string; base: string }> {
  let lastErr: Error | null = null;
  for (const base of MIRROR_DOMAINS) {
    try {
      const url = `${base}${pathWithQuery}`;
      const text = await fetchText(url);
      if (text.includes("exceeded the 'max_user_connections'") || text.length < 300) {
        lastErr = new Error(`Mirror ${base} database busy`);
        continue;
      }
      return { text, base };
    } catch (err: any) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('All LibGen mirror domains failed');
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…');
}

function isUsefulTitle(text: string): boolean {
  if (!text || text.length < 2) return false;
  if (/^\d+$/.test(text)) return false;
  if (/^#\d+/.test(text)) return false;
  if (/^[0-9; \-Xx]+$/.test(text)) return false;
  if (/^[frclb]\s*\d+$/i.test(text)) return false;
  if (text.toLowerCase() === 'b' || text.toLowerCase() === 'book') return false;
  if (/^\d{4}[ -](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text)) return false;
  return true;
}

function formatAuthor(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  let cleaned = raw.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\s*\([^)]*\)$/, '').trim();
  if (!cleaned) return undefined;
  const commaMatch = cleaned.match(/^([^,]+),\s*([^,]+)$/);
  if (commaMatch && !/author|editor/i.test(commaMatch[2])) {
    return `${commaMatch[2]} ${commaMatch[1]}`.trim();
  }
  return cleaned;
}

function cleanHtmlToProse(html: string): { title?: string; prose: string } {
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  clean = clean.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '');

  // Extract heading for chapter title
  const headingMatch = clean.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
  let title: string | undefined;
  if (headingMatch) {
    title = decodeHtmlEntities(headingMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));
  }

  // Extract paragraphs
  const paragraphs: string[] = [];
  const pRegex = /<(?:p|blockquote)[^>]*>([\s\S]*?)<\/(?:p|blockquote)>/gi;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = pRegex.exec(clean)) !== null) {
    const inner = pMatch[1].replace(/<br\s*\/?>/gi, '\n');
    const text = decodeHtmlEntities(inner.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    if (text.length > 0) {
      paragraphs.push(text);
    }
  }

  // Fallback if no <p> tags
  if (paragraphs.length === 0) {
    const text = decodeHtmlEntities(clean.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
    paragraphs.push(...lines);
  }

  return {
    title,
    prose: paragraphs.join('\n\n'),
  };
}

/**
 * Pure JavaScript in-memory EPUB decompressor & chapter extractor
 */
function unpackEpub(bookId: string, bytes: Uint8Array): EBookChapter[] {
  const unzipped = unzipSync(bytes);

  // 1. Locate rootfile from META-INF/container.xml
  const containerBytes = unzipped['META-INF/container.xml'];
  if (!containerBytes) {
    throw new Error('Invalid EPUB file: META-INF/container.xml missing');
  }

  const containerXml = strFromU8(containerBytes);
  const opfMatch = containerXml.match(/full-path=["']([^"']+)["']/i);
  if (!opfMatch) {
    throw new Error('Invalid EPUB: OPF rootfile path not found in container.xml');
  }

  const opfPath = opfMatch[1];
  const opfDir = opfPath.includes('/') ? opfPath.split('/').slice(0, -1).join('/') : '';
  const opfBytes = unzipped[opfPath];
  if (!opfBytes) {
    throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}`);
  }

  const opfXml = strFromU8(opfBytes);

  // 2. Build manifest map
  const manifest = new Map<string, string>();
  const itemRegex = /<item\b([^>]+)\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(opfXml)) !== null) {
    const attrs = m[1];
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
    if (idMatch && hrefMatch) {
      manifest.set(idMatch[1], hrefMatch[1]);
    }
  }

  // 3. Read spine in reading order
  const spineHrefs: string[] = [];
  const spineRegex = /<itemref\b([^>]+)\/?>/gi;
  while ((m = spineRegex.exec(opfXml)) !== null) {
    const idref = m[1].match(/\bidref=["']([^"']+)["']/i);
    if (idref && manifest.has(idref[1])) {
      spineHrefs.push(manifest.get(idref[1])!);
    }
  }

  // 4. Try reading Table of Contents from NCX
  const tocMap = new Map<string, string>();
  for (const [, href] of manifest.entries()) {
    if (href.endsWith('.ncx')) {
      const ncxPath = opfDir ? `${opfDir}/${href}` : href;
      const ncxBytes = unzipped[ncxPath] || unzipped[href];
      if (ncxBytes) {
        const ncxXml = strFromU8(ncxBytes);
        const npRegex = /<navPoint\b[\s\S]*?<navLabel>\s*<text>([\s\S]*?)<\/text>\s*<\/navLabel>\s*<content\s+src=["']([^"']+)["']/gi;
        let nm: RegExpExecArray | null;
        while ((nm = npRegex.exec(ncxXml)) !== null) {
          const label = decodeHtmlEntities(nm[1].trim());
          const src = nm[2].split('#')[0];
          if (label && src) {
            tocMap.set(src, label);
          }
        }
      }
      break;
    }
  }

  // 5. Parse each chapter file in spine order
  const chapters: EBookChapter[] = [];
  let position = 0;

  for (const rawHref of spineHrefs) {
    const relHref = rawHref.split('#')[0];
    const fullPath = opfDir ? `${opfDir}/${relHref}` : relHref;
    const fileBytes = unzipped[fullPath] || unzipped[relHref];
    if (!fileBytes) continue;

    const html = strFromU8(fileBytes);
    const { title: headingTitle, prose } = cleanHtmlToProse(html);

    // Skip purely empty pages with zero text unless it's a frontispiece
    const proseText = prose.length > 0 ? prose : '*(This section contains an illustration or frontispiece)*';
    const chapterTitle = tocMap.get(relHref) || headingTitle || `Chapter ${position + 1}`;
    const chapterId = `${bookId}:${position + 1}`;

    chapters.push({
      id: chapterId,
      title: chapterTitle,
      position,
      chapter: String(position + 1),
    });

    chapterTextCache.set(chapterId, proseText);
    position++;
  }

  return chapters;
}

function parseCatalogHtml(html: string, base: string): EBookSummary[] {
  const results: EBookSummary[] = [];
  const rows = html.match(/<tr\b[\s\S]*?<\/tr>/gi) || [];

  for (const row of rows) {
    const md5Match = row.match(/md5=([a-fA-F0-9]{32})/i);
    if (!md5Match) continue;

    const md5 = md5Match[1].toLowerCase();
    const cells = row.match(/<td\b[\s\S]*?<\/td>/gi) || [];
    if (cells.length < 8) continue;

    // Cover in cell 0
    let cover: string | undefined;
    let hasCoverCol = false;
    const firstCell = cells[0] || '';
    const secondCell = cells[1] || '';
    const coverImgMatch = firstCell.match(/<img\b[^>]*src=["']([^"']+)["']/i);

    if (coverImgMatch) {
      hasCoverCol = true;
      const src = coverImgMatch[1];
      if (!src.includes('blank.png') && !src.includes('logo.png')) {
        cover = src.startsWith('http') ? src : `${base}${src.startsWith('/') ? '' : '/'}${src}`;
      }
    }

    // Title in cell 1 (or 0)
    const titleCell = (hasCoverCol ? secondCell : firstCell).replace(/<(?:br|wbr|hr)\s*\/?>/gi, ' ');
    let bestTitle = '';

    const editionAnchor = titleCell.match(/<a\b[^>]*\bedition\.php[^>]*>([\s\S]*?)<\/a>/i);
    if (editionAnchor) {
      const inner = editionAnchor[1];
      const boldInAnchor = inner.match(/<b\b[^>]*>([\s\S]*?)<\/b>/i);
      const raw = boldInAnchor ? boldInAnchor[1] : inner;
      const txt = decodeHtmlEntities(raw.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
      if (isUsefulTitle(txt)) bestTitle = txt;
    }

    if (!bestTitle) {
      const boldMatch = titleCell.match(/<b\b[^>]*>([\s\S]*?)<\/b>/i);
      if (boldMatch) {
        const bTxt = decodeHtmlEntities(boldMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));
        if (isUsefulTitle(bTxt)) bestTitle = bTxt;
      }
    }

    if (!bestTitle) {
      const anyAnchor = titleCell.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i);
      if (anyAnchor) {
        const txt = decodeHtmlEntities(anyAnchor[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));
        if (isUsefulTitle(txt)) bestTitle = txt;
      }
    }

    if (!bestTitle) {
      bestTitle = `Book (${md5.slice(0, 8)})`;
    }

    const offset = hasCoverCol ? 1 : 0;
    const rawAuthor = cells[offset + 1]?.replace(/<[^>]+>/g, '').trim();
    const author = formatAuthor(rawAuthor);
    const publisher = cells[offset + 2]?.replace(/<[^>]+>/g, '').trim();
    const yearMatch = cells[offset + 3]?.match(/\b(\d{4})\b/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;
    const fileSize = cells[offset + 6]?.replace(/<[^>]+>/g, '').trim();
    const format = cells[offset + 7]?.replace(/<[^>]+>/g, '').trim()?.toLowerCase();

    // Add format badge so user easily identifies EPUB vs PDF vs AZW3
    const formatBadge = format ? ` [${format.toUpperCase()}]` : '';
    const displayTitle = bestTitle.includes('[') ? bestTitle : `${bestTitle}${formatBadge}`;

    results.push({
      id: md5,
      title: displayTitle,
      author,
      cover,
      year,
      genres: format ? [format.toUpperCase()] : undefined,
      description: publisher ? `${publisher} (${year || 'N/A'}) • ${fileSize || ''}` : undefined,
      siteUrl: `${base}/ads.php?md5=${md5}`,
    });
  }

  return results;
}

export const plugin: EBookProvider = {
  id: 'libgen-stream',
  name: 'Library Genesis (Stream)',

  async popular(offset: number): Promise<EBookSummary[]> {
    const page = Math.floor(offset / 25) + 1;
    const path = `/index.php?req=fiction&page=${page}&topics[]=l&topics[]=f&covers=on`;
    const { text, base } = await fetchFromMirrors(path);
    return parseCatalogHtml(text, base);
  },

  async search(query: string, offset: number): Promise<EBookSummary[]> {
    const page = Math.floor(offset / 25) + 1;
    const path = `/index.php?req=${encodeURIComponent(query)}&page=${page}&topics[]=l&topics[]=f&covers=on`;
    const { text, base } = await fetchFromMirrors(path);
    return parseCatalogHtml(text, base);
  },

  async detail(id: string): Promise<EBookSummary | null> {
    const path = `/ads.php?md5=${id}`;
    const { text, base } = await fetchFromMirrors(path);

    // Parse structured BibTeX
    const bibMatch = text.match(/<textarea[^>]*id=["']bibtext["'][^>]*>([\s\S]*?)<\/textarea>/i);
    let title = '';
    let author = '';
    let publisher = '';
    let isbn = '';
    let year: number | undefined;

    if (bibMatch) {
      const bib = bibMatch[1];
      const t = bib.match(/title\s*=\s*\{([^}]+)\}/i);
      const a = bib.match(/author\s*=\s*\{([^}]+)\}/i);
      const p = bib.match(/publisher\s*=\s*\{([^}]+)\}/i);
      const is = bib.match(/isbn\s*=\s*\{([^}]+)\}/i);
      const y = bib.match(/year\s*=\s*\{([^}]+)\}/i);
      if (t) title = decodeHtmlEntities(t[1].trim());
      if (a) author = a[1].trim();
      if (p) publisher = decodeHtmlEntities(p[1].trim());
      if (is) isbn = is[1].replace(/[- ]/g, '').trim();
      if (y) year = parseInt(y[1], 10) || undefined;
    }

    if (!title) {
      const tMatch = text.match(/Title:\s*([^<\n\r]+)/i);
      if (tMatch) title = decodeHtmlEntities(tMatch[1].trim());
    }
    if (!author) {
      const aMatch = text.match(/Author\(s\):\s*<a[^>]*>([^<]+)<\/a>/i) || text.match(/Author\(s\):\s*([^<\n\r]+)/i);
      if (aMatch) author = aMatch[1].trim();
    }
    if (!publisher) {
      const pMatch = text.match(/Publisher:\s*([^<\n\r]+)/i);
      if (pMatch) publisher = decodeHtmlEntities(pMatch[1].trim());
    }
    if (!isbn) {
      const isMatch = text.match(/ISBN:\s*([0-9Xx\- ]+)/i);
      if (isMatch) isbn = isMatch[1].replace(/[- ]/g, '').trim();
    }
    if (!year) {
      const yMatch = text.match(/Year:\s*(\d{4})/i);
      if (yMatch) year = parseInt(yMatch[1], 10) || undefined;
    }

    let cover: string | undefined;
    const coverMatch = text.match(/<img[^>]*src=["']([^"']*(?:covers|fictioncovers|fictionruscovers)[^"']*)["']/i);
    if (coverMatch) {
      const rawCover = coverMatch[1];
      if (!rawCover.includes('blank.png') && !rawCover.includes('logo.png')) {
        cover = rawCover.startsWith('http') ? rawCover : `${base}${rawCover.startsWith('/') ? '' : '/'}${rawCover}`;
      }
    }

    const formattedAuthor = formatAuthor(author);
    const descParts: string[] = [];
    if (formattedAuthor) descParts.push(`Author: ${formattedAuthor}`);
    if (publisher) descParts.push(`Publisher: ${publisher}`);
    if (year) descParts.push(`Year: ${year}`);
    if (isbn) descParts.push(`ISBN: ${isbn}`);

    return {
      id,
      title: title || `Book (${id.slice(0, 8)})`,
      author: formattedAuthor,
      cover,
      isbn: isbn || undefined,
      year,
      description: descParts.length > 0 ? descParts.join(' • ') : undefined,
      siteUrl: `${base}/ads.php?md5=${id}`,
    };
  },

  async chapters(id: string): Promise<EBookChapter[]> {
    // 1. Check in-memory cache
    const cached = bookChaptersCache.get(id);
    if (cached && cached.length > 0) {
      return cached;
    }

    // 2. Fast check: Is the book already cached on user's VPS Docker server?
    if (PROXY_SERVER_URL) {
      try {
        const jsonStr = await fetchText(`${PROXY_SERVER_URL.replace(/\/+$/, '')}/api/v1/book/${id}/chapters`);
        const data = JSON.parse(jsonStr);
        if (data && Array.isArray(data.chapters) && data.chapters.length > 0) {
          bookChaptersCache.set(id, data.chapters);
          return data.chapters;
        }
      } catch (_) {
        // Not in VPS cache yet, continue to resolve download URL
      }
    }

    try {
      // 3. Fetch ads.php to resolve download URL with security token (from client residential connection)
      const { text: adsHtml, base } = await fetchFromMirrors(`/ads.php?md5=${id}`);
      const getMatch = adsHtml.match(/<a[^>]*href=["'](get\.php\?[^"']*md5=[a-fA-F0-9]{32}[^"']*)["']/i);

      let downloadUrl: string;
      if (getMatch) {
        const rel = getMatch[1].replace(/&amp;/g, '&');
        downloadUrl = `${base}/${rel.startsWith('/') ? rel.slice(1) : rel}`;
      } else {
        downloadUrl = `${base}/get.php?md5=${id}`;
      }

      // 4. If VPS proxy is configured, pass the direct download URL so VPS can download & cache it permanently
      if (PROXY_SERVER_URL) {
        try {
          const vpsUrl = `${PROXY_SERVER_URL.replace(/\/+$/, '')}/api/v1/book/${id}/chapters?downloadUrl=${encodeURIComponent(downloadUrl)}`;
          const jsonStr = await fetchText(vpsUrl);
          const data = JSON.parse(jsonStr);
          if (data && Array.isArray(data.chapters) && data.chapters.length > 0) {
            bookChaptersCache.set(id, data.chapters);
            return data.chapters;
          }
        } catch (_) {
          // If VPS processing fails or times out, fall through to in-app direct unpacking
        }
      }

      // 5. In-app fallback: Download directly in Harbor using safe bridge with Referer
      const dlHeaders: Record<string, string> = {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': `${base}/ads.php?md5=${id}`,
      };

      const bytes = await fetchBinary(downloadUrl, dlHeaders);

      // 6. Verify ZIP archive magic bytes (0x50, 0x4B) and unpack EPUB
      const isZip = bytes && bytes.length > 100 && bytes[0] === 0x50 && bytes[1] === 0x4B;
      if (isZip) {
        const chapters = unpackEpub(id, bytes);
        if (chapters.length > 0) {
          bookChaptersCache.set(id, chapters);
          return chapters;
        }
      }
    } catch (_) {
      // Graceful fallback for non-EPUB formats (AZW3, PDF, etc.)
    }

    // 7. Fallback: Never return empty chapters to Harbor
    const fallbackChapterId = `overview:${id}`;
    const fallbackChapters: EBookChapter[] = [
      {
        id: fallbackChapterId,
        title: 'Book Overview & Download Links',
        position: 0,
        chapter: '1',
      },
    ];
    bookChaptersCache.set(id, fallbackChapters);
    return fallbackChapters;
  },

  async content(chapterId: string): Promise<string> {
    // 1. Instant cache lookup
    const cached = chapterTextCache.get(chapterId);
    if (cached) {
      return cached;
    }

    // 2. Try user's VPS Docker server if configured
    if (PROXY_SERVER_URL && !chapterId.startsWith('overview:')) {
      const parts = chapterId.split(':');
      if (parts.length >= 2) {
        const bookId = parts[0];
        try {
          const jsonStr = await fetchText(
            `${PROXY_SERVER_URL.replace(/\/+$/, '')}/api/v1/book/${bookId}/chapter/${encodeURIComponent(chapterId)}`
          );
          const data = JSON.parse(jsonStr);
          if (data && typeof data.content === 'string' && data.content.length > 0) {
            chapterTextCache.set(chapterId, data.content);
            return data.content;
          }
        } catch (_) {}
      }
    }

    // 3. Fallback: If not in memory cache and VPS didn't return it, unpack book chapters
    if (!chapterId.startsWith('overview:')) {
      const parts = chapterId.split(':');
      if (parts.length >= 2) {
        const bookId = parts[0];
        await this.chapters(bookId);
        const secondCheck = chapterTextCache.get(chapterId);
        if (secondCheck) return secondCheck;
      }
    }

    // 2. Handle overview fallback chapter for non-EPUB / PDF / AZW3 formats
    if (chapterId.startsWith('overview:')) {
      const bookId = chapterId.replace(/^overview:/, '');
      try {
        const book = await this.detail(bookId);
        const { text: adsHtml, base } = await fetchFromMirrors(`/ads.php?md5=${bookId}`);
        const getMatch = adsHtml.match(/<a[^>]*href=["'](get\.php\?[^"']*md5=[a-fA-F0-9]{32}[^"']*)["']/i);
        const dlUrl = getMatch
          ? `https://libgen.li/${getMatch[1].replace(/&amp;/g, '&')}`
          : `https://libgen.li/get.php?md5=${bookId}`;

        const lines: string[] = [
          `# ${book?.title || 'Book Overview'}`,
          book?.author ? `*By ${book.author}${book.year ? ` (${book.year})` : ''}*` : '',
          book?.description ? `**Details:** ${book.description}` : '',
          '---\n\n### 📖 Reader Notice',
          '> ℹ️ **About this Edition**:\n> This specific file could not be parsed into chapter-by-chapter text (it is in **PDF**, **AZW3**, or **Kindle** format, rather than standard EPUB).\n>\n> 💡 **Tip for Harbor Reader**:\n> Search for this book title again in Harbor and look for the version tagged with **[EPUB]** to stream and read chapters directly in Harbor!',
          '---\n\n### 📥 Direct File Links',
          `🔗 **[Direct Download File](${dlUrl})**`,
          `🔗 **[Download via Library.lol Mirror](https://library.lol/main/${bookId})**`,
          `🔗 **[LibGen Web Page](${base}/ads.php?md5=${bookId})**`,
        ];
        return lines.filter(Boolean).join('\n\n');
      } catch (_) {
        return `# Book Overview\n\nDirect download page: https://libgen.li/ads.php?md5=${chapterId.replace(/^overview:/, '')}`;
      }
    }

    // 3. Direct link / bookmark without previous chapters() call
    const parts = chapterId.split(':');
    if (parts.length >= 2) {
      const bookId = parts[0];
      await this.chapters(bookId);
      const text = chapterTextCache.get(chapterId);
      if (text) return text;
    }

    return '*(Chapter content is currently loading or unavailable)*';
  },

  async tags(): Promise<EBookTag[]> {
    return [
      { id: 'topic:fiction', name: 'Fiction', group: 'Topic' },
      { id: 'topic:literature', name: 'Literature', group: 'Topic' },
    ];
  },
};

if (typeof harbor !== 'undefined' && harbor.register) {
  harbor.register(plugin);
}
