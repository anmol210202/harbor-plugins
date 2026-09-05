import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import * as cheerio from 'cheerio';
import { CacheService } from '../services/cache.js';
import { EpubResolver } from '../services/epubResolver.js';
import { EpubParser } from '../services/epubParser.js';
import type { SearchResultItem } from '../types.js';

const BASE = 'https://libgen.li';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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

export const bookRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Search endpoint
  server.get<{
    Querystring: { q?: string; page?: string };
  }>('/api/v1/search', async (req, reply) => {
    const q = req.query.q || '';
    const page = parseInt(req.query.page || '1', 10) || 1;

    const searchUrl = q
      ? `${BASE}/index.php?req=${encodeURIComponent(q)}&page=${page}&topics[]=l&topics[]=f&covers=on`
      : `${BASE}/index.php?req=fiction&page=${page}&topics[]=l&topics[]=f&covers=on`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Cookie': 'covers=on',
      },
    });

    if (!res.ok) {
      return reply.status(res.status).send({ error: `LibGen HTTP ${res.status}` });
    }

    const html = await res.text();
    const cleanHtml = html.replace(/<(?:br|wbr|hr)\s*\/?>/gi, ' ');
    const $ = cheerio.load(cleanHtml);

    const results: SearchResultItem[] = [];

    $('#tablelibgen tbody tr, #tablelibgen tr').each((_, tr) => {
      const rowHtml = $(tr).html() || '';
      const md5Match = rowHtml.match(/md5=([a-fA-F0-9]{32})/i);
      if (!md5Match) return;

      const md5 = md5Match[1].toLowerCase();
      const cells = $(tr).find('td');
      if (cells.length < 8) return;

      // Cover in cell 0
      const coverImg = $(cells[0]).find('img');
      let cover: string | undefined;
      let hasCoverCol = false;

      if (coverImg.length > 0) {
        hasCoverCol = true;
        const src = coverImg.attr('src') || '';
        if (src && !src.includes('blank.png') && !src.includes('logo.png')) {
          cover = src.startsWith('http') ? src : `${BASE}${src.startsWith('/') ? '' : '/'}${src}`;
        }
      }

      // Title in cell 1 (or 0)
      const titleCell = hasCoverCol ? cells[1] : cells[0];
      let bestTitle = '';

      $(titleCell).find('a').each((__, a) => {
        const href = $(a).attr('href') || '';
        if (!href.includes('edition.php')) return;
        const txt = $(a).text().trim().replace(/\s+/g, ' ');
        if (isUsefulTitle(txt)) {
          bestTitle = txt;
          return false; // break
        }
      });

      if (!bestTitle) {
        const b = $(titleCell).find('b').text().trim().replace(/\s+/g, ' ');
        if (isUsefulTitle(b)) bestTitle = b;
      }

      if (!bestTitle) {
        bestTitle = `Book (${md5.slice(0, 8)})`;
      }

      const offset = hasCoverCol ? 1 : 0;
      const rawAuthor = $(cells[offset + 1]).text().trim();
      const year = parseInt($(cells[offset + 3]).text().trim(), 10) || undefined;
      const fileSize = $(cells[offset + 6]).text().trim() || undefined;
      const format = $(cells[offset + 7]).text().trim().toLowerCase() || undefined;

      results.push({
        id: md5,
        title: bestTitle,
        author: formatAuthor(rawAuthor),
        year,
        format,
        cover,
        fileSize,
      });
    });

    reply.header('Cache-Control', 'public, max-age=300');
    return {
      query: q,
      page,
      results,
    };
  });

  // Popular fiction
  server.get<{
    Querystring: { page?: string };
  }>('/api/v1/popular', async (req, reply) => {
    const page = parseInt(req.query.page || '1', 10) || 1;
    const url = `${BASE}/index.php?req=fiction&page=${page}&topics[]=l&topics[]=f&covers=on`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Cookie': 'covers=on',
      },
    });

    if (!res.ok) {
      return reply.status(res.status).send({ error: `LibGen HTTP ${res.status}` });
    }

    const html = await res.text();
    const cleanHtml = html.replace(/<(?:br|wbr|hr)\s*\/?>/gi, ' ');
    const $ = cheerio.load(cleanHtml);
    const results: SearchResultItem[] = [];

    $('#tablelibgen tbody tr, #tablelibgen tr').each((_, tr) => {
      const rowHtml = $(tr).html() || '';
      const md5Match = rowHtml.match(/md5=([a-fA-F0-9]{32})/i);
      if (!md5Match) return;

      const md5 = md5Match[1].toLowerCase();
      const cells = $(tr).find('td');
      if (cells.length < 8) return;

      const coverImg = $(cells[0]).find('img');
      let cover: string | undefined;
      let hasCoverCol = false;

      if (coverImg.length > 0) {
        hasCoverCol = true;
        const src = coverImg.attr('src') || '';
        if (src && !src.includes('blank.png') && !src.includes('logo.png')) {
          cover = src.startsWith('http') ? src : `${BASE}${src.startsWith('/') ? '' : '/'}${src}`;
        }
      }

      const titleCell = hasCoverCol ? cells[1] : cells[0];
      let bestTitle = '';

      $(titleCell).find('a').each((__, a) => {
        const href = $(a).attr('href') || '';
        if (!href.includes('edition.php')) return;
        const txt = $(a).text().trim().replace(/\s+/g, ' ');
        if (isUsefulTitle(txt)) {
          bestTitle = txt;
          return false;
        }
      });

      if (!bestTitle) {
        const b = $(titleCell).find('b').text().trim().replace(/\s+/g, ' ');
        if (isUsefulTitle(b)) bestTitle = b;
      }

      if (!bestTitle) bestTitle = `Book (${md5.slice(0, 8)})`;

      const offset = hasCoverCol ? 1 : 0;
      const rawAuthor = $(cells[offset + 1]).text().trim();
      const year = parseInt($(cells[offset + 3]).text().trim(), 10) || undefined;
      const fileSize = $(cells[offset + 6]).text().trim() || undefined;
      const format = $(cells[offset + 7]).text().trim().toLowerCase() || undefined;

      results.push({
        id: md5,
        title: bestTitle,
        author: formatAuthor(rawAuthor),
        year,
        format,
        cover,
        fileSize,
      });
    });

    reply.header('Cache-Control', 'public, max-age=1800');
    return {
      page,
      results,
    };
  });

  // Book Detail
  server.get<{
    Params: { md5: string };
  }>('/api/v1/book/:md5/detail', async (req, reply) => {
    const { md5 } = req.params;

    const cached = CacheService.getBookDetail(md5);
    if (cached) {
      reply.header('Cache-Control', 'public, max-age=86400');
      return cached;
    }

    try {
      const meta = await EpubResolver.resolveMetadataAndDownloadUrl(md5);
      const detail = {
        id: md5,
        title: meta.title,
        author: formatAuthor(meta.author),
        publisher: meta.publisher,
        year: meta.year,
        isbn: meta.isbn,
        cover: meta.cover,
        description: [meta.publisher, meta.year ? `(${meta.year})` : ''].filter(Boolean).join(' '),
      };

      CacheService.saveBookDetail(md5, detail);
      reply.header('Cache-Control', 'public, max-age=86400');
      return detail;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // Book Chapters
  server.get<{
    Params: { md5: string };
  }>('/api/v1/book/:md5/chapters', async (req, reply) => {
    const { md5 } = req.params;

    // Check if chapters are already parsed and cached
    const cachedChapters = CacheService.getChapters(md5);
    if (cachedChapters && cachedChapters.length > 0) {
      reply.header('Cache-Control', 'public, max-age=604800');
      return {
        id: md5,
        totalChapters: cachedChapters.length,
        chapters: cachedChapters,
      };
    }

    try {
      // 1. Download buffer
      const buffer = await EpubResolver.downloadBookBuffer(md5);

      // 2. Parse EPUB / FB2
      const parsed = EpubParser.parse(buffer);

      // 3. Save chapters and content into cache
      const chapterInfos = parsed.chapters.map(c => c.info);
      CacheService.saveChapters(md5, chapterInfos);

      for (const ch of parsed.chapters) {
        CacheService.saveChapterContent(md5, ch.info.id, ch.content);
      }

      // Update detail with real chapter count
      const existingDetail = CacheService.getBookDetail(md5);
      if (existingDetail) {
        existingDetail.chaptersCount = chapterInfos.length;
        CacheService.saveBookDetail(md5, existingDetail);
      }

      reply.header('Cache-Control', 'public, max-age=604800');
      return {
        id: md5,
        title: parsed.title,
        author: parsed.author,
        totalChapters: chapterInfos.length,
        chapters: chapterInfos,
      };
    } catch (err: any) {
      return reply.status(500).send({ error: `Failed to unpack chapters for ${md5}: ${err.message}` });
    }
  });

  // Chapter Content
  server.get<{
    Params: { md5: string; chapterId: string };
  }>('/api/v1/book/:md5/chapter/:chapterId', async (req, reply) => {
    const { md5, chapterId } = req.params;

    const cachedContent = CacheService.getChapterContent(md5, chapterId);
    if (cachedContent !== null) {
      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      return {
        bookId: md5,
        chapterId,
        content: cachedContent,
      };
    }

    // If not cached, trigger chapters extraction flow first
    try {
      const buffer = await EpubResolver.downloadBookBuffer(md5);
      const parsed = EpubParser.parse(buffer);

      const chapterInfos = parsed.chapters.map(c => c.info);
      CacheService.saveChapters(md5, chapterInfos);

      for (const ch of parsed.chapters) {
        CacheService.saveChapterContent(md5, ch.info.id, ch.content);
      }

      const requested = parsed.chapters.find(c => c.info.id === chapterId);
      if (!requested) {
        return reply.status(404).send({ error: `Chapter ${chapterId} not found in book ${md5}` });
      }

      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      return {
        bookId: md5,
        chapterId,
        content: requested.content,
      };
    } catch (err: any) {
      return reply.status(500).send({ error: `Failed to fetch chapter ${chapterId}: ${err.message}` });
    }
  });
};
