import type { EBookChapter, EBookProvider, EBookSummary, EBookTag } from '../../../shared/types/ebook.js';
import type { HElement } from '../../../shared/types/harbor.js';
import { createUrlResolver } from '../../../shared/utils/url.js';
import { calcPage, cleanTitle, parseNumber } from '../../../shared/utils/text.js';

const BASE = 'https://example-ebook-host.test';
const resolveUrl = createUrlResolver(BASE);

async function getDoc(path: string) {
  const res = await harbor.http(BASE + path, { responseType: 'text' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return harbor.parseHtml(res.body);
}

function browseQuery(tagId?: string): string {
  const params = new URLSearchParams();
  if (tagId?.startsWith('status:')) params.set('status', tagId.slice(7));
  if (tagId?.startsWith('sort:')) params.set('sort', tagId.slice(5));
  const query = params.toString();
  return query ? `&${query}` : '';
}

function cardToSummary(el: HElement): EBookSummary | null {
  const link = el.querySelector('a.cover');
  const img = el.querySelector('img');
  if (!link) return null;

  const rawTitle = link.attr('title') || el.querySelector('.title')?.text() || '';
  const href = link.attr('href') || '';

  return {
    id: href.replace(/^\/ebook\//, '').replace(/\/$/, ''),
    title: cleanTitle(rawTitle),
    seriesTitle: el.attr('data-series-title') || undefined,
    altTitles: (el.attr('data-alt-titles') || '').split('|').filter(Boolean),
    isbn: el.attr('data-isbn') || undefined,
    googleBooksId: el.attr('data-google-books-id') || undefined,
    openLibraryId: el.attr('data-open-library-id') || undefined,
    wikidataId: el.attr('data-wikidata-id') || undefined,
    anilistId: parseNumber(el.attr('data-anilist-id')),
    cover: resolveUrl(img?.attr('data-src') || img?.attr('src')),
    status: el.attr('data-status') || undefined,
    originalLanguage: el.attr('data-original-language') || undefined,
    genres: (el.attr('data-genres') || '').split('|').filter(Boolean),
    chapters: parseNumber(el.attr('data-chapters')),
    score: parseNumber(el.attr('data-rating')),
    trendingScore: parseNumber(el.attr('data-trending-score')),
    isFanMade:
      Boolean(el.querySelector("[data-edition='fan'], .fan-edition")) ||
      /(?:fan[ -]?made|fan edition|نسخة\s*الفان)/iu.test(rawTitle),
  };
}

export const plugin: EBookProvider = {
  id: 'example-ebook',
  name: 'Example eBook Source',

  async popular(offset: number, tagId?: string): Promise<EBookSummary[]> {
    const page = calcPage(offset);
    const filters = browseQuery(tagId);
    const doc = await getDoc(`/browse?page=${page}${filters}`);
    return doc.querySelectorAll('.grid .card').map(cardToSummary).filter((s): s is EBookSummary => s !== null);
  },

  async search(query: string, offset: number, tagId?: string): Promise<EBookSummary[]> {
    const page = calcPage(offset);
    const filters = browseQuery(tagId);
    const doc = await getDoc(`/search?q=${encodeURIComponent(query)}&page=${page}${filters}`);
    return doc.querySelectorAll('.grid .card').map(cardToSummary).filter((s): s is EBookSummary => s !== null);
  },

  async detail(id: string): Promise<EBookSummary | null> {
    const doc = await getDoc(`/ebook/${id}`);
    const root = doc.querySelector('.series');
    if (!root) return null;

    return {
      id,
      title: cleanTitle(root.querySelector('h1')?.text() || id),
      seriesTitle: root.querySelector('.series-title')?.text() || undefined,
      altTitles: root.querySelectorAll('.alt-title').map((node) => node.text()).filter(Boolean),
      isbn: root.attr('data-isbn') || undefined,
      googleBooksId: root.attr('data-google-books-id') || undefined,
      openLibraryId: root.attr('data-open-library-id') || undefined,
      wikidataId: root.attr('data-wikidata-id') || undefined,
      anilistId: parseNumber(root.attr('data-anilist-id')),
      cover: resolveUrl(root.querySelector('img.poster')?.attr('src')),
      description: root.querySelector('.summary')?.text() || undefined,
      status: root.querySelector('.status')?.text() || undefined,
      author: root.querySelector('.author')?.text() || undefined,
      chapters: parseNumber(root.attr('data-chapters')),
      volumes: parseNumber(root.attr('data-volumes')),
      originalLanguage: root.attr('data-original-language') || undefined,
      genres: root.querySelectorAll('.genres a').map((node) => node.text()).filter(Boolean),
      score: parseNumber(root.attr('data-rating')),
      trendingScore: parseNumber(root.attr('data-trending-score')),
    };
  },

  async chapters(id: string): Promise<EBookChapter[]> {
    const doc = await getDoc(`/ebook/${id}/chapters`);
    return doc
      .querySelectorAll('.chapter-list li a')
      .map((a, position) => {
        const href = a.attr('href') || '';
        return {
          id: href.replace(/^\//, ''),
          chapter: a.attr('data-number') || undefined,
          position,
          title: a.querySelector('.name')?.text() || undefined,
          volume: a.attr('data-volume') || undefined,
          volumeTitle: a.attr('data-volume-title') || undefined,
          pages: 0,
          language: 'en',
          publishAt: a.querySelector('.date')?.attr('datetime') || undefined,
          views: a.querySelector('.views')?.text()?.replace(/\s*views?$/i, '').trim() || undefined,
        };
      })
      .filter((c) => Boolean(c.id));
  },

  async content(chapterId: string): Promise<string> {
    const doc = await getDoc(`/${chapterId}`);
    const blocks = doc.querySelectorAll('.chapter-content > p, .chapter-content > blockquote');
    return blocks
      .map((node) => node.text().trim())
      .filter(Boolean)
      .join('\n\n');
  },

  async tags(): Promise<EBookTag[]> {
    return [
      { id: 'status:ongoing', name: 'Ongoing', group: 'Status' },
      { id: 'status:completed', name: 'Completed', group: 'Status' },
      { id: 'status:hiatus', name: 'Hiatus', group: 'Status' },
      { id: 'sort:popular', name: 'Popular', group: 'Sort' },
      { id: 'sort:chapters', name: 'Chapters', group: 'Sort' },
      { id: 'sort:rating', name: 'Rating', group: 'Sort' },
    ];
  },
};

// Explicit harbor registration
harbor.register(plugin);
