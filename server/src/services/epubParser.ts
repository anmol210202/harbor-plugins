import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';
import type { ChapterInfo } from '../types.js';

export interface ParsedBook {
  title: string;
  author?: string;
  chapters: Array<{
    info: ChapterInfo;
    content: string;
  }>;
}

function cleanHtmlToProse(html: string): { title?: string; prose: string } {
  const $ = cheerio.load(html);

  // Remove elements that don't belong in reader view
  $('script, style, noscript, nav, header, footer, iframe, svg').remove();

  // Try to find a chapter title from headings
  const titleEl = $('h1, h2, h3, title').first();
  const title = titleEl.text().trim() || undefined;

  // Extract all paragraphs and standalone text blocks
  const paragraphs: string[] = [];
  $('p, blockquote, div.paragraph, div.calibre').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length > 0) {
      paragraphs.push(text);
    }
  });

  // If no paragraphs were found via <p>, fallback to line breaks in body
  if (paragraphs.length === 0) {
    const raw = $('body').text();
    const lines = raw.split(/\n+/).map(l => l.trim()).filter(Boolean);
    paragraphs.push(...lines);
  }

  return {
    title,
    prose: paragraphs.join('\n\n'),
  };
}

export const EpubParser = {
  parse(buffer: Buffer): ParsedBook {
    // Check if FB2 XML or ZIP archive
    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B;

    if (!isZip) {
      // Attempt FB2 parse
      return this.parseFb2(buffer.toString('utf8'));
    }

    const zip = new AdmZip(buffer);

    // 1. Locate rootfile from META-INF/container.xml
    const containerEntry = zip.getEntry('META-INF/container.xml');
    if (!containerEntry) {
      throw new Error('Invalid EPUB: META-INF/container.xml missing');
    }

    const containerXml = containerEntry.getData().toString('utf8');
    const opfMatch = containerXml.match(/full-path=["']([^"']+)["']/i);
    if (!opfMatch) {
      throw new Error('Invalid EPUB: OPF rootfile path not found in container.xml');
    }

    const opfPath = opfMatch[1];
    const opfDir = opfPath.includes('/') ? opfPath.split('/').slice(0, -1).join('/') : '';
    const opfEntry = zip.getEntry(opfPath);
    if (!opfEntry) {
      throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}`);
    }

    const opfXml = opfEntry.getData().toString('utf8');
    const $opf = cheerio.load(opfXml, { xmlMode: true });

    const bookTitle = $opf('metadata dc\\:title, metadata title').first().text().trim() || 'Untitled Book';
    const bookAuthor = $opf('metadata dc\\:creator, metadata creator').first().text().trim() || undefined;

    // 2. Build manifest map
    const manifest = new Map<string, string>();
    $opf('manifest item').each((_, el) => {
      const id = $opf(el).attr('id');
      const href = $opf(el).attr('href');
      if (id && href) manifest.set(id, href);
    });

    // 3. Read spine in reading order
    const spineHrefs: string[] = [];
    $opf('spine itemref').each((_, el) => {
      const idref = $opf(el).attr('idref');
      if (idref && manifest.has(idref)) {
        spineHrefs.push(manifest.get(idref)!);
      }
    });

    // 4. Try reading Table of Contents from NCX / nav for explicit chapter names
    const tocMap = new Map<string, string>();
    const ncxId = $opf('spine').attr('toc');
    const ncxHref = ncxId ? manifest.get(ncxId) : 'toc.ncx';

    if (ncxHref) {
      const ncxPath = opfDir ? `${opfDir}/${ncxHref}` : ncxHref;
      const ncxEntry = zip.getEntry(ncxPath) || zip.getEntry(ncxHref);
      if (ncxEntry) {
        const $ncx = cheerio.load(ncxEntry.getData().toString('utf8'), { xmlMode: true });
        $ncx('navPoint').each((_, np) => {
          const label = $ncx(np).find('navLabel text').first().text().trim();
          const src = $ncx(np).find('content').attr('src')?.split('#')[0];
          if (label && src) {
            tocMap.set(src, label);
          }
        });
      }
    }

    // 5. Parse each chapter file
    const parsedChapters: Array<{ info: ChapterInfo; content: string }> = [];
    let position = 0;

    for (let i = 0; i < spineHrefs.length; i++) {
      const relHref = spineHrefs[i].split('#')[0];
      const fullPath = opfDir ? `${opfDir}/${relHref}` : relHref;

      const entry = zip.getEntry(fullPath) || zip.getEntry(relHref);
      if (!entry) continue;

      const html = entry.getData().toString('utf8');
      const { title: inlineTitle, prose } = cleanHtmlToProse(html);

      // Skip empty or purely decorative intro pages (under 50 chars) unless it has a heading
      if (prose.length < 50 && !inlineTitle) continue;

      const chapterTitle = tocMap.get(relHref) || inlineTitle || `Chapter ${position + 1}`;
      const chapterId = String(position + 1);

      parsedChapters.push({
        info: {
          id: chapterId,
          title: chapterTitle,
          position,
        },
        content: prose,
      });

      position++;
    }

    return {
      title: bookTitle,
      author: bookAuthor,
      chapters: parsedChapters,
    };
  },

  parseFb2(xml: string): ParsedBook {
    const $ = cheerio.load(xml, { xmlMode: true });

    const bookTitle = $('description title-info book-title').text().trim() || 'Untitled Book';
    const authorFirst = $('description title-info author first-name').text().trim();
    const authorLast = $('description title-info author last-name').text().trim();
    const bookAuthor = [authorFirst, authorLast].filter(Boolean).join(' ') || undefined;

    const chapters: Array<{ info: ChapterInfo; content: string }> = [];
    let position = 0;

    $('body > section').each((_, sec) => {
      const title = $(sec).find('> title').text().replace(/\s+/g, ' ').trim() || `Chapter ${position + 1}`;
      const paragraphs: string[] = [];

      $(sec).find('p').each((__, p) => {
        const t = $(p).text().replace(/\s+/g, ' ').trim();
        if (t.length > 0) paragraphs.push(t);
      });

      if (paragraphs.length > 0) {
        chapters.push({
          info: {
            id: String(position + 1),
            title,
            position,
          },
          content: paragraphs.join('\n\n'),
        });
        position++;
      }
    });

    return {
      title: bookTitle,
      author: bookAuthor,
      chapters,
    };
  },
};
