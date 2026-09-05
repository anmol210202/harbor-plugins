import type { EBookChapter, EBookProvider, EBookSummary, EBookTag } from '../../../shared/types/ebook.js';
import type { HElement } from '../../../shared/types/harbor.js';
import { createUrlResolver } from '../../../shared/utils/url.js';
import { calcPage, cleanTitle, parseNumber } from '../../../shared/utils/text.js';
import { extractProse } from '../../../shared/utils/prose.js';

const BASE = 'https://freewebnovel.com';
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

function parseCard(el: HElement): EBookSummary | null {
  const link = el.querySelector('h3.tit a, .tit a');
  const img = el.querySelector('.pic img, img');
  if (!link) return null;

  const rawHref = link.attr('href') || '';
  const match = rawHref.match(/\/novel\/([^/?#]+)/);
  if (!match) return null;

  const id = match[1];
  const title = cleanTitle(link.text() || link.attr('title'));
  const score = parseNumber(el.querySelector('.core span')?.text());

  return {
    id,
    title,
    cover: resolveUrl(img?.attr('src') || img?.attr('data-src')),
    score,
  };
}

export const plugin: EBookProvider = {
  id: 'freewebnovel',
  name: 'FreeWebNovel',

  async popular(offset: number, tagId?: string): Promise<EBookSummary[]> {
    const page = calcPage(offset);
    let path = `/sort/most-popular/${page}`;

    if (tagId === 'sort:latest') {
      path = `/sort/latest-novel/${page}`;
    } else if (tagId === 'sort:completed') {
      path = `/sort/completed-novel/${page}`;
    } else if (tagId?.startsWith('genre:')) {
      const genre = encodeURIComponent(tagId.slice(6));
      path = `/genre/${genre}/${page}`;
    }

    const doc = await getDoc(path);
    return doc.querySelectorAll('.li').map(parseCard).filter((b): b is EBookSummary => b !== null);
  },

  async search(query: string, offset: number): Promise<EBookSummary[]> {
    const res = await harbor.http(`${BASE}/search`, {
      method: 'POST',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `keyword=${encodeURIComponent(query)}`,
      responseType: 'text',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} during search`);
    const doc = await harbor.parseHtml(res.body);
    return doc.querySelectorAll('.li').map(parseCard).filter((b): b is EBookSummary => b !== null);
  },

  async detail(id: string): Promise<EBookSummary | null> {
    const doc = await getDoc(`/novel/${id}`);
    const titleEl = doc.querySelector('h1.tit, .m-desc .tit');
    const coverEl = doc.querySelector('.pic img, .m-imgtxt img');
    const descEl = doc.querySelector('.inner, .m-desc .txt');

    const authorEl = doc.querySelector('a[href*="/author/"]');
    const genres = doc.querySelectorAll('a[href*="/genre/"]')
      .map((g) => g.text().trim())
      .filter(Boolean);

    const score = parseNumber(doc.querySelector('.score span, .core span')?.text());

    return {
      id,
      title: cleanTitle(titleEl?.text() || id),
      author: authorEl?.text()?.trim() || undefined,
      cover: resolveUrl(coverEl?.attr('src')),
      description: descEl?.text()?.trim() || undefined,
      genres: genres.length > 0 ? genres : undefined,
      score,
    };
  },

  async chapters(id: string): Promise<EBookChapter[]> {
    const doc = await getDoc(`/novel/${id}`);
    const links = doc.querySelectorAll('a[href*="/novel/' + id + '/chapter-"]');

    const chapters: EBookChapter[] = [];
    const seen = new Set<string>();

    for (const a of links) {
      const href = a.attr('href') || '';
      if (!href || seen.has(href)) continue;
      seen.add(href);

      const path = href.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '');
      const rawTitle = a.text().trim() || a.attr('title')?.trim() || '';
      const chapterMatch = href.match(/chapter-(\d+)/);
      const chapterNum = chapterMatch ? chapterMatch[1] : undefined;

      chapters.push({
        id: path,
        title: rawTitle || (chapterNum ? `Chapter ${chapterNum}` : `Chapter ${chapters.length + 1}`),
        chapter: chapterNum,
        position: chapters.length,
      });
    }

    return chapters;
  },

  async content(chapterId: string): Promise<string> {
    const doc = await getDoc(`/${chapterId}`);
    return extractProse(doc, '#txt, .txt', 'p');
  },

  async tags(): Promise<EBookTag[]> {
    return [
      { id: 'sort:popular', name: 'Most Popular', group: 'Sort' },
      { id: 'sort:latest', name: 'Latest Releases', group: 'Sort' },
      { id: 'sort:completed', name: 'Completed', group: 'Sort' },
      { id: 'genre:Action', name: 'Action', group: 'Genre' },
      { id: 'genre:Adventure', name: 'Adventure', group: 'Genre' },
      { id: 'genre:Fantasy', name: 'Fantasy', group: 'Genre' },
      { id: 'genre:Martial+Arts', name: 'Martial Arts', group: 'Genre' },
      { id: 'genre:Mystery', name: 'Mystery', group: 'Genre' },
      { id: 'genre:Romance', name: 'Romance', group: 'Genre' },
      { id: 'genre:Sci-Fi', name: 'Sci-Fi', group: 'Genre' },
      { id: 'genre:Supernatural', name: 'Supernatural', group: 'Genre' },
      { id: 'genre:Xianxia', name: 'Xianxia', group: 'Genre' },
    ];
  },
};

harbor.register(plugin);
