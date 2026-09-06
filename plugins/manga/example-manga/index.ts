import type { MangaChapter, MangaProvider, MangaSummary, MangaTag } from '../../../shared/types/manga.js';
import type { HElement } from '../../../shared/types/harbor.js';
import { createUrlResolver } from '../../../shared/utils/url.js';
import { calcPage, cleanTitle } from '../../../shared/utils/text.js';

const DEFAULT_BASE = 'https://example.com';

function getBaseUrl(): string {
  if (typeof harbor !== 'undefined' && typeof harbor.getPreference === 'function') {
    return harbor.getPreference('mirrorUrl', DEFAULT_BASE) || DEFAULT_BASE;
  }
  return DEFAULT_BASE;
}

const resolveUrl = createUrlResolver(DEFAULT_BASE);

async function getDoc(path: string) {
  const base = getBaseUrl();
  const res = await harbor.http(base + path, { responseType: 'text' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return harbor.parseHtml(res.body);
}

function cardToSummary(el: HElement): MangaSummary | null {
  const link = el.querySelector('a.cover');
  const img = el.querySelector('img');
  if (!link) return null;

  const rawTitle = link.attr('title') || el.querySelector('.title')?.text() || '';
  const href = link.attr('href') || '';

  return {
    id: href.replace(/^\/manga\//, '').replace(/\/$/, ''),
    title: cleanTitle(rawTitle),
    cover: resolveUrl(img?.attr('data-src') || img?.attr('src')),
  };
}

export const plugin: MangaProvider = {
  id: 'example-manga',
  name: 'Example Manga Source',

  async popular(offset: number, tagId?: string): Promise<MangaSummary[]> {
    const page = calcPage(offset);
    const query = tagId ? `&genre=${encodeURIComponent(tagId)}` : '';
    const doc = await getDoc(`/browse?sort=popular&page=${page}${query}`);
    return doc.querySelectorAll('.grid .card').map(cardToSummary).filter((s): s is MangaSummary => s !== null);
  },

  async search(query: string, offset: number, tagId?: string): Promise<MangaSummary[]> {
    const page = calcPage(offset);
    const tag = tagId ? `&genre=${encodeURIComponent(tagId)}` : '';
    const doc = await getDoc(`/search?q=${encodeURIComponent(query)}&page=${page}${tag}`);
    return doc.querySelectorAll('.grid .card').map(cardToSummary).filter((s): s is MangaSummary => s !== null);
  },

  async detail(id: string): Promise<MangaSummary | null> {
    const doc = await getDoc(`/manga/${id}`);
    const root = doc.querySelector('.series');
    if (!root) return null;

    return {
      id,
      title: cleanTitle(root.querySelector('h1')?.text() || id),
      altTitle: root.querySelector('.alt-title')?.text(),
      cover: resolveUrl(root.querySelector('img.poster')?.attr('src')),
      description: root.querySelector('.summary')?.text(),
      status: root.querySelector('.status')?.text(),
      author: root.querySelector('.author')?.text(),
      lastChapter: root.querySelector('.chapter-list li a')?.text(),
    };
  },

  async chapters(id: string): Promise<MangaChapter[]> {
    const doc = await getDoc(`/manga/${id}/chapters`);
    return doc
      .querySelectorAll('.chapter-list li a')
      .map((a) => {
        const href = a.attr('href') || '';
        return {
          id: href.replace(/^\//, ''),
          chapter: a.attr('data-number') || null,
          title: a.querySelector('.name')?.text(),
          volume: a.attr('data-volume') || null,
          pages: 0,
          language: 'en',
          publishAt: a.querySelector('.date')?.attr('datetime') || undefined,
        };
      })
      .filter((c) => Boolean(c.id));
  },

  async pageUrls(chapterId: string): Promise<string[]> {
    // Attempt JSON API first
    const data = await harbor.http<{ images?: string[] }>(`${getBaseUrl()}/api/${chapterId}/pages`, { responseType: 'json' });
    if (data && Array.isArray(data.images)) {
      return data.images.map(resolveUrl).filter((url): url is string => Boolean(url));
    }

    // Fallback: parse HTML reader
    const doc = await getDoc(`/${chapterId}`);
    return doc
      .querySelectorAll('.reader img')
      .map((img) => resolveUrl(img.attr('data-src') || img.attr('src')))
      .filter((url): url is string => Boolean(url));
  },

  async tags(): Promise<MangaTag[]> {
    const doc = await getDoc('/genres');
    return doc
      .querySelectorAll('.genre-list a')
      .map((a) => ({
        id: (a.attr('href') || '').replace(/^\/genre\//, ''),
        name: a.text(),
        group: 'Genre',
      }))
      .filter((t) => Boolean(t.id && t.name));
  },

  preferences: [
    {
      key: 'mirrorUrl',
      label: 'Mirror Domain',
      type: 'text',
      default: 'https://example.com',
    },
    {
      key: 'imageQuality',
      label: 'Image Quality',
      type: 'select',
      options: ['high', 'medium', 'low'],
      default: 'high',
    },
    {
      key: 'dataSaver',
      label: 'Data Saver Mode',
      type: 'checkbox',
      default: false,
    },
  ],

  async getFilters() {
    return [
      {
        id: 'sort',
        name: 'Sort By',
        filters: [
          {
            type: 'sort' as const,
            id: 'order',
            name: 'Order',
            values: ['Popularity', 'Latest Update', 'Alphabetical', 'Rating'],
            selectedIndex: 0,
            ascending: false,
          },
        ],
      },
      {
        id: 'status',
        name: 'Publication Status',
        filters: [
          {
            type: 'select' as const,
            id: 'status',
            name: 'Status',
            values: ['All', 'Ongoing', 'Completed', 'Hiatus'],
            selectedIndex: 0,
          },
        ],
      },
      {
        id: 'genres',
        name: 'Genres',
        filters: [
          { type: 'tri-state' as const, id: 'action', name: 'Action', state: 'ignore' as const },
          { type: 'tri-state' as const, id: 'adventure', name: 'Adventure', state: 'ignore' as const },
          { type: 'tri-state' as const, id: 'comedy', name: 'Comedy', state: 'ignore' as const },
          { type: 'tri-state' as const, id: 'fantasy', name: 'Fantasy', state: 'ignore' as const },
          { type: 'tri-state' as const, id: 'romance', name: 'Romance', state: 'ignore' as const },
          { type: 'tri-state' as const, id: 'sci-fi', name: 'Sci-Fi', state: 'ignore' as const },
        ],
      },
    ];
  },
};

// Explicit harbor registration as recommended by Harbor docs
harbor.register(plugin);
