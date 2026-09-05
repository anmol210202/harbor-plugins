import type { EBookChapter, EBookProvider, EBookSummary, EBookTag } from '../../../shared/types/ebook.js';
import type { HElement } from '../../../shared/types/harbor.js';
import { createUrlResolver } from '../../../shared/utils/url.js';
import { cleanTitle, parseNumber } from '../../../shared/utils/text.js';

const BASE = 'https://libgen.li';
const resolveUrl = createUrlResolver(BASE);

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

async function getDoc(path: string) {
  const url = path.startsWith('http') ? path : BASE + path;
  const res = await harbor.http(url, {
    responseType: 'text',
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return harbor.parseHtml(res.body);
}

/**
 * Filters out edition numbers, dates, and ISBN-like tokens to find the actual title candidate.
 */
function isUsefulTitle(text: string): boolean {
  if (text.length < 2) return false;
  // Pure digits or ID
  if (/^\d+$/.test(text)) return false;
  // Volume or series index (e.g. "#1", "#12")
  if (/^#\d+/.test(text)) return false;
  // ISBN-like
  if (/^[0-9; \-Xx]+$/.test(text)) return false;
  // Date marker (e.g. "2023-01", "2014 Mars")
  if (/^\d{4}[ -](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text)) return false;
  return true;
}

function parseRow(tr: HElement): EBookSummary | null {
  const cells = tr.querySelectorAll('td');
  if (cells.length < 8) return null;

  // Find MD5 from mirrors column
  let md5: string | undefined;
  const links = tr.querySelectorAll('a');
  for (const a of links) {
    const href = a.attr('href') || '';
    const match = href.match(/md5=([a-fA-F0-9]{32})/);
    if (match) {
      md5 = match[1].toLowerCase();
      break;
    }
  }
  if (!md5) return null;

  // Title extraction: iterate all anchors in cell 0 and select the longest valid title
  const cell0 = cells[0];
  const anchors = cell0.querySelectorAll('a');
  let bestTitle = '';

  for (const a of anchors) {
    const txt = cleanTitle(a.text().trim());
    if (isUsefulTitle(txt) && txt.length > bestTitle.length) {
      bestTitle = txt;
    }
  }

  // Fallback if anchors didn't yield a title
  if (!bestTitle) {
    const rawCell = cell0.text().trim();
    const candidate = cleanTitle(rawCell.split('\n')[0]);
    if (isUsefulTitle(candidate)) {
      bestTitle = candidate;
    } else {
      bestTitle = `Book (${md5.slice(0, 8)})`;
    }
  }

  const author = cells[1]?.text()?.trim();
  const publisher = cells[2]?.text()?.trim();
  const year = parseNumber(cells[3]?.text());
  const language = cells[4]?.text()?.trim();
  const pages = parseNumber(cells[5]?.text());
  const fileSize = cells[6]?.text()?.trim();
  const format = cells[7]?.text()?.trim()?.toLowerCase();

  return {
    id: md5,
    title: bestTitle,
    author: author ? cleanTitle(author) : undefined,
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
    const doc = await getDoc(`/index.php?req=fiction&page=${page}&topics[]=l&topics[]=f`);
    const rows = doc.querySelectorAll('#tablelibgen tbody tr, #tablelibgen tr');
    return rows.map(parseRow).filter((r): r is EBookSummary => r !== null);
  },

  async search(query: string, offset: number): Promise<EBookSummary[]> {
    const page = Math.floor(offset / 25) + 1;
    const doc = await getDoc(`/index.php?req=${encodeURIComponent(query)}&page=${page}&topics[]=l&topics[]=f`);
    const rows = doc.querySelectorAll('#tablelibgen tbody tr, #tablelibgen tr');
    return rows.map(parseRow).filter((r): r is EBookSummary => r !== null);
  },

  async detail(id: string): Promise<EBookSummary | null> {
    const doc = await getDoc(`/ads.php?md5=${id}`);
    const coverImg = doc.querySelector('img[src*="/covers/"], img');
    const titleEl = doc.querySelector('h1, h2, .title');
    const descEl = doc.querySelector('#description, .description, tr:has(td:contains("Description")) td:nth-child(2)');

    // Extract ISBN to trigger Harbor's native AniList / Google Books / Open Library enrichers
    let isbn: string | undefined;
    const allText = doc.querySelector('body')?.text() || '';
    const isbnMatch = allText.match(/ISBN(?:-1[03])?:?\s*([0-9Xx-]{10,17})/i);
    if (isbnMatch) {
      isbn = isbnMatch[1].replace(/[- ]/g, '');
    }

    const cover = coverImg ? resolveUrl(coverImg.attr('src')) : undefined;

    return {
      id,
      title: titleEl ? cleanTitle(titleEl.text()) : id,
      cover,
      isbn,
      description: descEl?.text()?.trim() || undefined,
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
    const doc = await getDoc(`/ads.php?md5=${md5}`);

    const title = cleanTitle(doc.querySelector('h1, h2')?.text() || 'Book Overview');
    const desc = doc.querySelector('#description, .description')?.text()?.trim();
    const getLink = doc.querySelector('a[href*="get.php?md5="]');
    const downloadUrl = getLink ? resolveUrl(getLink.attr('href')) : undefined;

    const sections: string[] = [
      `# ${title}`,
      desc ? `### Synopsis\n${desc}` : '',
      '### Download Links',
      downloadUrl ? `Direct Download: ${downloadUrl}` : '',
      `Library.lol Mirror: https://library.lol/main/${md5}`,
      `LibGen Page: ${BASE}/ads.php?md5=${md5}`,
      '\n(Note: LibGen distributes complete downloadable files. For reading chapter-by-chapter prose directly inside Harbor, check out Royal Road or FreeWebNovel!)',
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
