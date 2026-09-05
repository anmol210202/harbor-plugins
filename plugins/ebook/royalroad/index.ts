import type { EBookChapter, EBookProvider, EBookSummary, EBookTag, EBookVolume } from '../../../shared/types/ebook.js';
import type { HElement } from '../../../shared/types/harbor.js';
import { createUrlResolver } from '../../../shared/utils/url.js';
import { calcPage, cleanTitle, parseNumber } from '../../../shared/utils/text.js';
import { extractProse } from '../../../shared/utils/prose.js';

const BASE = 'https://www.royalroad.com';
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

function parseCard(el: HElement): EBookSummary | null {
  const link = el.querySelector('.fiction-title a');
  const img = el.querySelector('img');
  if (!link) return null;

  const rawHref = link.attr('href') || '';
  const match = rawHref.match(/\/fiction\/(\d+(?:\/[^/]+)?)/);
  if (!match) return null;

  const id = match[1];
  const title = cleanTitle(link.text());
  const author = el.querySelector('.author a')?.text() || el.querySelector('span.author')?.text();
  const desc = el.querySelector('.fiction-description')?.text();

  const genres = el.querySelectorAll('.tags a, .fiction-tag')
    .map((tag) => tag.text().trim())
    .filter(Boolean);

  const stats = el.querySelectorAll('.stats .col-sm-2, .stats span');
  let score: number | undefined;
  for (const s of stats) {
    const txt = s.text();
    if (txt.includes('Score') || s.attr('title')?.includes('Rating')) {
      score = parseNumber(txt);
    }
  }

  return {
    id,
    title,
    author: author ? cleanTitle(author) : undefined,
    cover: resolveUrl(img?.attr('src') || img?.attr('data-src')),
    description: desc || undefined,
    genres: genres.length > 0 ? genres : undefined,
    score,
    status: el.querySelector('.label')?.text()?.toLowerCase() || undefined,
  };
}

export const plugin: EBookProvider = {
  id: 'royalroad',
  name: 'Royal Road',

  async popular(offset: number, tagId?: string): Promise<EBookSummary[]> {
    const page = calcPage(offset);
    let path = `/fictions/active-popular?page=${page}`;

    if (tagId === 'sort:rating') {
      path = `/fictions/best-rated?page=${page}`;
    } else if (tagId === 'sort:popular') {
      path = `/fictions/weekly-popular?page=${page}`;
    } else if (tagId?.startsWith('genre:')) {
      const genre = encodeURIComponent(tagId.slice(6));
      path = `/fictions/search?genre=${genre}&page=${page}&orderBy=popularity`;
    }

    const doc = await getDoc(path);
    return doc.querySelectorAll('.fiction-list-item').map(parseCard).filter((b): b is EBookSummary => b !== null);
  },

  async search(query: string, offset: number, tagId?: string): Promise<EBookSummary[]> {
    const page = calcPage(offset);
    let path = `/fictions/search?title=${encodeURIComponent(query)}&page=${page}`;
    if (tagId?.startsWith('genre:')) {
      path += `&genre=${encodeURIComponent(tagId.slice(6))}`;
    }

    const doc = await getDoc(path);
    return doc.querySelectorAll('.fiction-list-item').map(parseCard).filter((b): b is EBookSummary => b !== null);
  },

  async detail(id: string): Promise<EBookSummary | null> {
    const doc = await getDoc(`/fiction/${id}`);
    const root = doc.querySelector('.fiction-header, .page-content-inner');
    if (!root) return null;

    const titleEl = root.querySelector('h1.font-white, h1');
    const authorEl = root.querySelector('h4 a, .fiction-info a');
    const coverEl = root.querySelector('img.thumbnail, .cover-art-container img');
    const descEl = doc.querySelector('.description .hidden-content, .description');
    const statusEl = doc.querySelector('.fiction-info .label');

    const genres = doc.querySelectorAll('.fiction-info .tags a')
      .map((g) => g.text().trim())
      .filter(Boolean);

    return {
      id,
      title: cleanTitle(titleEl?.text() || id),
      author: authorEl?.text()?.trim() || undefined,
      cover: resolveUrl(coverEl?.attr('src')),
      description: descEl?.text()?.trim() || undefined,
      status: statusEl?.text()?.trim()?.toLowerCase() || undefined,
      genres: genres.length > 0 ? genres : undefined,
    };
  },

  async chapters(id: string): Promise<Array<EBookChapter | EBookVolume>> {
    const doc = await getDoc(`/fiction/${id}`);
    const rows = doc.querySelectorAll('#chapters tbody tr');
    if (rows.length === 0) return [];

    const volumes: EBookVolume[] = [];
    let currentVolume: EBookVolume = {
      volume: '1',
      volumeTitle: 'Volume 1',
      chapters: [],
    };

    let position = 0;

    for (const row of rows) {
      // Check if this row is a volume header
      const isVolumeHeader = row.attr('class')?.includes('volume-header') || row.querySelector('.volume-header');
      if (isVolumeHeader) {
        const headerTitle = row.text().trim();
        if (currentVolume.chapters.length > 0) {
          volumes.push(currentVolume);
        }
        const volNum = String(volumes.length + 1);
        currentVolume = {
          volume: volNum,
          volumeTitle: headerTitle || `Volume ${volNum}`,
          chapters: [],
        };
        continue;
      }

      const link = row.querySelector('a');
      if (!link) continue;

      const href = link.attr('href') || '';
      if (!href) continue;

      const title = link.text().trim();
      const dateEl = row.querySelector('time');

      currentVolume.chapters.push({
        id: href.replace(/^\//, ''),
        title,
        position,
        publishAt: dateEl?.attr('datetime') || dateEl?.text()?.trim() || undefined,
      });

      position++;
    }

    if (currentVolume.chapters.length > 0) {
      volumes.push(currentVolume);
    }

    // If only 1 generic volume was created, return flat chapters for simplicity
    if (volumes.length === 1 && volumes[0].volumeTitle === 'Volume 1') {
      return volumes[0].chapters;
    }

    return volumes;
  },

  async content(chapterId: string): Promise<string> {
    const doc = await getDoc(`/${chapterId}`);
    return extractProse(doc, '.chapter-inner.chapter-content', 'p');
  },

  async tags(): Promise<EBookTag[]> {
    return [
      { id: 'sort:popular', name: 'Weekly Popular', group: 'Sort' },
      { id: 'sort:rating', name: 'Best Rated', group: 'Sort' },
      { id: 'genre:action', name: 'Action', group: 'Genre' },
      { id: 'genre:adventure', name: 'Adventure', group: 'Genre' },
      { id: 'genre:fantasy', name: 'Fantasy', group: 'Genre' },
      { id: 'genre:sci-fi', name: 'Sci-Fi', group: 'Genre' },
      { id: 'genre:litrpg', name: 'LitRPG', group: 'Genre' },
      { id: 'genre:comedy', name: 'Comedy', group: 'Genre' },
      { id: 'genre:mystery', name: 'Mystery', group: 'Genre' },
      { id: 'genre:psychological', name: 'Psychological', group: 'Genre' },
    ];
  },
};

harbor.register(plugin);
