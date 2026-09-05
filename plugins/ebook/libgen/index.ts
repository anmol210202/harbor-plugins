import type { EBookChapter, EBookProvider, EBookSummary, EBookTag } from '../../../shared/types/ebook.js';
import type { HElement } from '../../../shared/types/harbor.js';
import { createUrlResolver } from '../../../shared/utils/url.js';
import { cleanTitle, parseNumber } from '../../../shared/utils/text.js';

const BASE = 'https://libgen.li';
const resolveUrl = createUrlResolver(BASE);

async function getDoc(path: string) {
  const url = path.startsWith('http') ? path : BASE + path;
  const res = await harbor.http(url, {
    responseType: 'text',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return harbor.parseHtml(res.body);
}

function parseRow(tr: HElement): EBookSummary | null {
  const cells = tr.querySelectorAll('td');
  if (cells.length < 8) return null;

  // Cell 0 contains title & series links
  const cell0 = cells[0];
  const titleLink = cell0.querySelector('a[href*="edition.php"]') || cell0.querySelector('a[href*="series.php"]') || cell0.querySelector('a');
  if (!titleLink) return null;

  const rawTitle = titleLink.text().trim();
  if (rawTitle.length < 2) return null;

  // Find MD5 from mirrors column or links
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

  const author = cells[1]?.text()?.trim();
  const publisher = cells[2]?.text()?.trim();
  const year = parseNumber(cells[3]?.text());
  const language = cells[4]?.text()?.trim();
  const pages = parseNumber(cells[5]?.text());
  const format = cells[7]?.text()?.trim()?.toLowerCase();

  return {
    id: md5,
    title: cleanTitle(rawTitle),
    author: author ? cleanTitle(author) : undefined,
    year,
    genres: format ? [format.toUpperCase()] : undefined,
    originalLanguage: language || undefined,
    description: publisher ? `Publisher: ${publisher} • Format: ${format || 'EPUB'}` : undefined,
    siteUrl: `${BASE}/ads.php?md5=${md5}`,
  };
}

export const plugin: EBookProvider = {
  id: 'libgen',
  name: 'Library Genesis (Books)',

  async popular(offset: number): Promise<EBookSummary[]> {
    // Search latest curated fiction additions
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

    // Look for ISBN on the page
    let isbn: string | undefined;
    const allText = doc.querySelector('body')?.text() || '';
    const isbnMatch = allText.match(/ISBN(?:-1[03])?:?\s*([0-9Xx-]{10,17})/i);
    if (isbnMatch) {
      isbn = isbnMatch[1].replace(/[- ]/g, '');
    }

    return {
      id,
      title: titleEl ? cleanTitle(titleEl.text()) : id,
      cover: resolveUrl(coverImg?.attr('src')),
      isbn,
      description: descEl?.text()?.trim() || undefined,
      siteUrl: `${BASE}/ads.php?md5=${id}`,
    };
  },

  async chapters(id: string): Promise<EBookChapter[]> {
    // Return primary readable book chapter referencing the edition
    const doc = await getDoc(`/ads.php?md5=${id}`);
    const getLink = doc.querySelector('a[href*="get.php?md5="]');
    const downloadPath = getLink ? getLink.attr('href') : `get.php?md5=${id}`;

    return [
      {
        id: (downloadPath || id).replace(/^\//, ''),
        title: 'Complete Book',
        position: 0,
        chapter: '1',
      },
    ];
  },

  async content(chapterId: string): Promise<string> {
    const doc = await getDoc(`/${chapterId}`);
    const desc = doc.querySelector('#description, .description, body')?.text()?.trim();
    return desc || 'Book details and chapters loaded into Harbor library.';
  },

  async tags(): Promise<EBookTag[]> {
    return [
      { id: 'topic:fiction', name: 'Fiction', group: 'Topic' },
      { id: 'topic:literature', name: 'Literature', group: 'Topic' },
    ];
  },
};

harbor.register(plugin);
