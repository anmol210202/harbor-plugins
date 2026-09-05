import type { EBookChapter, EBookProvider, EBookSummary, EBookTag, EBookVolume } from '../../../shared/types/ebook.js';
import type { HElement } from '../../../shared/types/harbor.js';
import { createUrlResolver } from '../../../shared/utils/url.js';
import { calcPage, cleanTitle, parseNumber } from '../../../shared/utils/text.js';
import { extractProse } from '../../../shared/utils/prose.js';

const BASE = 'https://novelbin.me';
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
  const link = el.querySelector('h3.novel-title a, .novel-title a');
  const img = el.querySelector('img.cover, img');
  if (!link) return null;

  const rawHref = link.attr('href') || '';
  const match = rawHref.match(/\/b\/([^/?#]+)/);
  if (!match) return null;

  const id = match[1];
  const title = cleanTitle(link.text() || link.attr('title'));
  const author = el.querySelector('.author')?.text()?.trim();

  return {
    id,
    title,
    author: author ? cleanTitle(author) : undefined,
    cover: resolveUrl(img?.attr('data-src') || img?.attr('src')),
  };
}

export const plugin: EBookProvider = {
  id: 'novelbin',
  name: 'NovelBin',

  async popular(offset: number, tagId?: string): Promise<EBookSummary[]> {
    const page = calcPage(offset);
    let path = `/sort/popular?page=${page}`;

    if (tagId === 'sort:top-view') {
      path = `/sort/top-view-novel?page=${page}`;
    } else if (tagId === 'sort:latest') {
      path = `/sort/latest-novel?page=${page}`;
    } else if (tagId?.startsWith('genre:')) {
      const genre = encodeURIComponent(tagId.slice(6));
      path = `/genre/${genre}?page=${page}`;
    }

    const doc = await getDoc(path);
    return doc.querySelectorAll('.list-novel .row, .list .row').map(parseCard).filter((b): b is EBookSummary => b !== null);
  },

  async search(query: string, offset: number): Promise<EBookSummary[]> {
    const page = calcPage(offset);
    const doc = await getDoc(`/search?keyword=${encodeURIComponent(query)}&page=${page}`);
    return doc.querySelectorAll('.list-novel .row, .list .row').map(parseCard).filter((b): b is EBookSummary => b !== null);
  },

  async detail(id: string): Promise<EBookSummary | null> {
    const doc = await getDoc(`/b/${id}`);
    const titleEl = doc.querySelector('h3.title, .desc h3');
    const coverEl = doc.querySelector('.book img, .desc img');
    const descEl = doc.querySelector('.desc-text, #tab-description');

    const genres = doc.querySelectorAll('a[href*="/genre/"]')
      .map((g) => g.text().trim())
      .filter(Boolean);

    const authors = doc.querySelectorAll('a[href*="/a/"]')
      .map((a) => a.text().trim())
      .filter(Boolean);

    const statusEl = doc.querySelector('a[href*="/status/"]');

    return {
      id,
      title: cleanTitle(titleEl?.text() || id),
      author: authors[0] || undefined,
      authors: authors.length > 0 ? authors : undefined,
      cover: resolveUrl(coverEl?.attr('data-src') || coverEl?.attr('src')),
      description: descEl?.text()?.trim() || undefined,
      status: statusEl?.text()?.trim()?.toLowerCase() || undefined,
      genres: genres.length > 0 ? genres : undefined,
    };
  },

  async chapters(id: string): Promise<Array<EBookChapter | EBookVolume>> {
    // NovelBin lists chapters either directly or through an ajax archive
    let doc = await getDoc(`/b/${id}`);
    let items = doc.querySelectorAll('.list-chapter li a');

    // If chapters were empty on main page, fetch the ajax chapter list
    if (items.length === 0) {
      try {
        const ajaxDoc = await getDoc(`/ajax/chapter-archive?novelId=${id}`);
        items = ajaxDoc.querySelectorAll('li a, .list-chapter a');
      } catch (_) {}
    }

    const chapters: EBookChapter[] = [];
    for (let position = 0; position < items.length; position++) {
      const a = items[position];
      const href = a.attr('href') || '';
      if (!href) continue;

      const path = href.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '');
      const title = a.text().trim() || a.attr('title')?.trim() || `Chapter ${position + 1}`;

      chapters.push({
        id: path,
        title,
        position,
        chapter: String(position + 1),
      });
    }
    return chapters;
  },

  async content(chapterId: string): Promise<string> {
    const doc = await getDoc(`/${chapterId}`);
    return extractProse(doc, '#chr-content, .chr-c', 'p');
  },

  async tags(): Promise<EBookTag[]> {
    return [
      { id: 'sort:popular', name: 'Popular', group: 'Sort' },
      { id: 'sort:top-view', name: 'Top Views', group: 'Sort' },
      { id: 'sort:latest', name: 'Latest', group: 'Sort' },
      { id: 'genre:action', name: 'Action', group: 'Genre' },
      { id: 'genre:fantasy', name: 'Fantasy', group: 'Genre' },
      { id: 'genre:xianxia', name: 'Xianxia', group: 'Genre' },
      { id: 'genre:romance', name: 'Romance', group: 'Genre' },
      { id: 'genre:isekai', name: 'Isekai', group: 'Genre' },
      { id: 'genre:supernatural', name: 'Supernatural', group: 'Genre' },
    ];
  },
};

harbor.register(plugin);
