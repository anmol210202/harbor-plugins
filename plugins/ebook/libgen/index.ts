import type { EBookChapter, EBookProvider, EBookSummary, EBookTag } from '../../../shared/types/ebook.js';
import type { HDocument, HElement } from '../../../shared/types/harbor.js';
import { createUrlResolver } from '../../../shared/utils/url.js';
import { cleanTitle, parseNumber } from '../../../shared/utils/text.js';

const BASE = 'https://libgen.li';
const resolveUrl = createUrlResolver(BASE);

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Cookie': 'covers=on',
};

async function getDoc(path: string): Promise<{ doc: HDocument; raw: string }> {
  const url = path.startsWith('http') ? path : BASE + path;
  const res = await harbor.http(url, {
    responseType: 'text',
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  // Pre-strip void tags that break HTML attribute parsing in LibGen templates
  const sanitized = res.body.replace(/<(?:br|wbr|hr)\s*\/?>/gi, ' ');
  const doc = await harbor.parseHtml(sanitized);
  return { doc, raw: res.body };
}

/**
 * Filters out edition numbers, dates, ISBNs, and badges to isolate the actual title.
 */
function isUsefulTitle(text: string): boolean {
  if (!text || text.length < 2) return false;
  // Pure digits or ID numbers
  if (/^\d+$/.test(text)) return false;
  // Volume or series index (e.g. "#1", "#12")
  if (/^#\d+/.test(text)) return false;
  // ISBN-like strings (digits with semicolons/spaces/dashes/X)
  if (/^[0-9; \-Xx]+$/.test(text)) return false;
  // LibGen badges e.g. "f 12345", "r 12345", "l 12345", "c 12345"
  if (/^[frclb]\s*\d+$/i.test(text)) return false;
  if (text.toLowerCase() === 'b' || text.toLowerCase() === 'book') return false;
  // Date marker (e.g. "2023-01", "2014 Mars")
  if (/^\d{4}[ -](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text)) return false;
  return true;
}

/**
 * Normalizes author names (e.g. "Zusak, Marcus" -> "Marcus Zusak")
 */
function formatAuthor(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  let cleaned = raw.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\s*\([^)]*\)$/, '').trim();
  const commaMatch = cleaned.match(/^([^,]+),\s*([^,]+)$/);
  if (commaMatch && !/author|editor/i.test(commaMatch[2])) {
    return `${commaMatch[2]} ${commaMatch[1]}`.trim();
  }
  return cleaned;
}

function parseRow(tr: HElement): EBookSummary | null {
  const cells = tr.querySelectorAll('td');
  if (cells.length < 8) return null;

  // Find MD5 from links in the row
  let md5: string | undefined;
  const links = tr.querySelectorAll('a');
  for (const a of links) {
    const href = a.attr('href') || '';
    const match = href.match(/md5=([a-fA-F0-9]{32})/i);
    if (match) {
      md5 = match[1].toLowerCase();
      break;
    }
  }
  if (!md5) return null;

  // Detect cover image in cell 0 (when covers=on is active)
  const cell0 = cells[0];
  const coverImg = cell0.querySelector('img');
  let cover: string | undefined;
  let hasCoverCol = false;

  if (coverImg) {
    hasCoverCol = true;
    const src = coverImg.attr('src') || '';
    if (src && !src.includes('blank.png') && !src.includes('logo.png')) {
      cover = resolveUrl(src);
    }
  }

  // Title column is cell 1 if cover column exists, otherwise cell 0
  const titleCell = hasCoverCol ? cells[1] : cells[0];
  let bestTitle = '';

  // 1. Prioritize edition.php anchor
  const anchors = titleCell.querySelectorAll('a');
  for (const a of anchors) {
    const href = a.attr('href') || '';
    if (!href.includes('edition.php')) continue;
    const txt = a.text().trim().replace(/\s+/g, ' ');
    if (isUsefulTitle(txt)) {
      bestTitle = txt;
      break;
    }
  }

  // 2. Bold text fallback
  if (!bestTitle) {
    const bold = titleCell.querySelector('b');
    if (bold) {
      const bTxt = bold.text().trim().replace(/\s+/g, ' ');
      if (isUsefulTitle(bTxt)) bestTitle = bTxt;
    }
  }

  // 3. Any anchor fallback
  if (!bestTitle) {
    for (const a of anchors) {
      const txt = a.text().trim().replace(/\s+/g, ' ');
      if (isUsefulTitle(txt)) {
        bestTitle = txt;
        break;
      }
    }
  }

  // 4. Default fallback
  if (!bestTitle) {
    bestTitle = `Book (${md5.slice(0, 8)})`;
  }

  const offset = hasCoverCol ? 1 : 0;
  const rawAuthor = cells[offset + 1]?.text()?.trim();
  const author = formatAuthor(rawAuthor);
  const publisher = cells[offset + 2]?.text()?.trim();
  const year = parseNumber(cells[offset + 3]?.text());
  const language = cells[offset + 4]?.text()?.trim();
  const pages = parseNumber(cells[offset + 5]?.text());
  const fileSize = cells[offset + 6]?.text()?.trim();
  const format = cells[offset + 7]?.text()?.trim()?.toLowerCase();

  return {
    id: md5,
    title: bestTitle,
    author,
    cover,
    year,
    genres: format ? [format.toUpperCase()] : undefined,
    originalLanguage: language || undefined,
    description: publisher ? `${publisher} (${year || 'N/A'}) • ${fileSize || ''}` : undefined,
    siteUrl: `${BASE}/ads.php?md5=${md5}`,
  };
}

export const plugin: EBookProvider = {
  id: 'libgen',
  name: 'Library Genesis (Books)',

  async popular(offset: number): Promise<EBookSummary[]> {
    const page = Math.floor(offset / 25) + 1;
    const { doc } = await getDoc(`/index.php?req=fiction&page=${page}&topics[]=l&topics[]=f&covers=on`);
    const rows = doc.querySelectorAll('#tablelibgen tbody tr, #tablelibgen tr');
    return rows.map(parseRow).filter((r): r is EBookSummary => r !== null);
  },

  async search(query: string, offset: number): Promise<EBookSummary[]> {
    const page = Math.floor(offset / 25) + 1;
    const { doc } = await getDoc(`/index.php?req=${encodeURIComponent(query)}&page=${page}&topics[]=l&topics[]=f&covers=on`);
    const rows = doc.querySelectorAll('#tablelibgen tbody tr, #tablelibgen tr');
    return rows.map(parseRow).filter((r): r is EBookSummary => r !== null);
  },

  async detail(id: string): Promise<EBookSummary | null> {
    const { raw } = await getDoc(`/ads.php?md5=${id}`);

    // Parse structured bibtext
    const bibMatch = raw.match(/<textarea[^>]*id=["']bibtext["'][^>]*>([\s\S]*?)<\/textarea>/i);
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
      if (t) title = t[1].trim();
      if (a) author = a[1].trim();
      if (p) publisher = p[1].trim();
      if (is) isbn = is[1].replace(/[- ]/g, '').trim();
      if (y) year = parseNumber(y[1]);
    }

    // Fallbacks from raw page text
    if (!title) {
      const tMatch = raw.match(/Title:\s*([^<\n\r]+)/i);
      if (tMatch) title = tMatch[1].trim();
    }
    if (!author) {
      const aMatch = raw.match(/Author\(s\):\s*<a[^>]*>([^<]+)<\/a>/i) || raw.match(/Author\(s\):\s*([^<\n\r]+)/i);
      if (aMatch) author = aMatch[1].trim();
    }
    if (!publisher) {
      const pMatch = raw.match(/Publisher:\s*([^<\n\r]+)/i);
      if (pMatch) publisher = pMatch[1].trim();
    }
    if (!isbn) {
      const isMatch = raw.match(/ISBN:\s*([0-9Xx\- ]+)/i);
      if (isMatch) isbn = isMatch[1].replace(/[- ]/g, '').trim();
    }
    if (!year) {
      const yMatch = raw.match(/Year:\s*(\d{4})/i);
      if (yMatch) year = parseNumber(yMatch[1]);
    }

    // Cover extraction - matches /fictioncovers/, /fictionruscovers/, /covers/
    let cover: string | undefined;
    const coverMatch = raw.match(/<img[^>]*src=["']([^"']*(?:covers|fictioncovers|fictionruscovers)[^"']*)["']/i);
    if (coverMatch) {
      const rawCover = coverMatch[1];
      if (!rawCover.includes('blank.png') && !rawCover.includes('logo.png')) {
        cover = resolveUrl(rawCover);
      }
    }

    const cleanBookTitle = title || `Book (${id.slice(0, 8)})`;
    const formattedAuthor = formatAuthor(author);

    const descLines: string[] = [];
    if (formattedAuthor) descLines.push(`Author: ${formattedAuthor}`);
    if (publisher) descLines.push(`Publisher: ${publisher}`);
    if (year) descLines.push(`Year: ${year}`);
    if (isbn) descLines.push(`ISBN: ${isbn}`);

    return {
      id,
      title: cleanBookTitle,
      author: formattedAuthor,
      cover,
      isbn: isbn || undefined,
      year,
      description: descLines.length > 0 ? descLines.join(' • ') : undefined,
      siteUrl: `${BASE}/ads.php?md5=${id}`,
    };
  },

  async chapters(id: string): Promise<EBookChapter[]> {
    return [
      {
        id: `overview-${id}`,
        title: 'Book Overview & Download Links',
        position: 0,
        chapter: '1',
      },
    ];
  },

  async content(chapterId: string): Promise<string> {
    const md5 = chapterId.replace(/^overview-/, '');
    const { raw } = await getDoc(`/ads.php?md5=${md5}`);

    // Parse structured bibtext
    const bibMatch = raw.match(/<textarea[^>]*id=["']bibtext["'][^>]*>([\s\S]*?)<\/textarea>/i);
    let title = '';
    let author = '';
    let publisher = '';
    let year = '';
    let isbn = '';

    if (bibMatch) {
      const bib = bibMatch[1];
      const t = bib.match(/title\s*=\s*\{([^}]+)\}/i);
      const a = bib.match(/author\s*=\s*\{([^}]+)\}/i);
      const p = bib.match(/publisher\s*=\s*\{([^}]+)\}/i);
      const y = bib.match(/year\s*=\s*\{([^}]+)\}/i);
      const is = bib.match(/isbn\s*=\s*\{([^}]+)\}/i);
      if (t) title = t[1].trim();
      if (a) author = a[1].trim();
      if (p) publisher = p[1].trim();
      if (y) year = y[1].trim();
      if (is) isbn = is[1].trim();
    }

    if (!title) {
      const tMatch = raw.match(/Title:\s*([^<\n\r]+)/i);
      if (tMatch) title = tMatch[1].trim();
    }
    if (!title) title = 'Book Overview';

    if (!author) {
      const aMatch = raw.match(/Author\(s\):\s*<a[^>]*>([^<]+)<\/a>/i) || raw.match(/Author\(s\):\s*([^<\n\r]+)/i);
      if (aMatch) author = aMatch[1].trim();
    }

    const formattedAuthor = formatAuthor(author);

    // Direct get link with session key
    const getMatch = raw.match(/<a[^>]*href=["'](get\.php\?[^"']*md5=[a-fA-F0-9]{32}[^"']*)["']/i);
    const directDownload = getMatch ? `${BASE}/${getMatch[1].replace(/&amp;/g, '&')}` : undefined;

    const sections: string[] = [
      `# ${title}`,
      formattedAuthor ? `*By ${formattedAuthor}${year ? ` (${year})` : ''}*` : '',
      publisher || isbn ? `**Publication Info:** ${[publisher, isbn ? `ISBN: ${isbn}` : ''].filter(Boolean).join(' • ')}` : '',
      '---\n\n### 📥 Download eBook Files',
      directDownload ? `🔗 **[Direct Download from LibGen](${directDownload})**` : '',
      `🔗 **[Download via Library.lol Mirror](https://library.lol/main/${md5})**`,
      `🔗 **[Open LibGen Information Page](${BASE}/ads.php?md5=${md5})**`,
      '---\n\n> ℹ️ **How to read in Harbor**:\n> LibGen distributes complete standalone eBook files (.epub, .pdf, .mobi). You can tap the download link above to save the file to your device, then open it using Harbor\'s local book reader or external reader.\n>\n> *Want continuous chapter-by-chapter reading right in Harbor without downloading files? Browse **Royal Road** or **FreeWebNovel** from your eBook sources!*',
    ];

    return sections.filter(Boolean).join('\n\n');
  },

  async tags(): Promise<EBookTag[]> {
    return [
      { id: 'topic:fiction', name: 'Fiction', group: 'Topic' },
      { id: 'topic:literature', name: 'Literature', group: 'Topic' },
    ];
  },
};

harbor.register(plugin);
