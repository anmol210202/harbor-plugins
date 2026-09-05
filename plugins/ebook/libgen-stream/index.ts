import type { EBookChapter, EBookProvider, EBookSummary, EBookTag } from '../../../shared/types/ebook.js';

// Live public endpoint for Harbor Book Proxy service on Render
const PROXY_URL = 'https://harbor-plugins.onrender.com';

interface ProxySearchItem {
  id: string;
  title: string;
  author?: string;
  year?: number;
  format?: string;
  cover?: string;
  fileSize?: string;
}

interface ProxySearchResult {
  page: number;
  results: ProxySearchItem[];
}

interface ProxyBookDetail {
  id: string;
  title: string;
  author?: string;
  publisher?: string;
  year?: number;
  isbn?: string;
  cover?: string;
  description?: string;
}

interface ProxyChaptersResponse {
  id: string;
  title?: string;
  author?: string;
  totalChapters: number;
  chapters: Array<{
    id: string;
    title: string;
    position: number;
  }>;
}

interface ProxyChapterContentResponse {
  bookId: string;
  chapterId: string;
  content: string;
}

export const plugin: EBookProvider = {
  id: 'libgen-stream',
  name: 'Library Genesis (Stream)',

  async popular(offset: number): Promise<EBookSummary[]> {
    const page = Math.floor(offset / 25) + 1;
    const res = await harbor.http<ProxySearchResult>(`${PROXY_URL}/api/v1/popular?page=${page}`, {
      responseType: 'json',
    });

    if (!res || !res.results) return [];

    return res.results.map((item) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      year: item.year,
      cover: item.cover,
      genres: item.format ? [item.format.toUpperCase()] : undefined,
      description: item.fileSize ? `Format: ${item.format || 'EPUB'} • ${item.fileSize}` : undefined,
    }));
  },

  async search(query: string, offset: number): Promise<EBookSummary[]> {
    const page = Math.floor(offset / 25) + 1;
    const res = await harbor.http<ProxySearchResult>(
      `${PROXY_URL}/api/v1/search?q=${encodeURIComponent(query)}&page=${page}`,
      {
        responseType: 'json',
      }
    );

    if (!res || !res.results) return [];

    return res.results.map((item) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      year: item.year,
      cover: item.cover,
      genres: item.format ? [item.format.toUpperCase()] : undefined,
      description: item.fileSize ? `Format: ${item.format || 'EPUB'} • ${item.fileSize}` : undefined,
    }));
  },

  async detail(id: string): Promise<EBookSummary | null> {
    const res = await harbor.http<ProxyBookDetail>(`${PROXY_URL}/api/v1/book/${id}/detail`, {
      responseType: 'json',
    });

    if (!res) return null;

    return {
      id: res.id,
      title: res.title,
      author: res.author,
      cover: res.cover,
      isbn: res.isbn,
      year: res.year,
      description: res.description,
    };
  },

  async chapters(id: string): Promise<EBookChapter[]> {
    const res = await harbor.http<ProxyChaptersResponse>(`${PROXY_URL}/api/v1/book/${id}/chapters`, {
      responseType: 'json',
    });

    if (!res || !res.chapters || res.chapters.length === 0) {
      return [
        {
          id: `${id}::1`,
          title: 'Complete Book / Preface',
          position: 0,
          chapter: '1',
        },
      ];
    }

    return res.chapters.map((ch) => ({
      id: `${id}::${ch.id}`,
      title: ch.title,
      position: ch.position,
      chapter: String(ch.position + 1),
    }));
  },

  async content(chapterId: string): Promise<string> {
    const parts = chapterId.split('::');
    if (parts.length < 2) {
      throw new Error(`Invalid chapter identifier: ${chapterId}`);
    }

    const [bookId, chId] = parts;
    const res = await harbor.http<ProxyChapterContentResponse>(
      `${PROXY_URL}/api/v1/book/${bookId}/chapter/${chId}`,
      {
        responseType: 'json',
      }
    );

    if (!res || typeof res.content !== 'string') {
      throw new Error(`Failed to load content for chapter ${chId} from proxy.`);
    }

    if (!res.content.trim()) {
      return '*(This section contains an illustration or frontispiece)*';
    }

    return res.content;
  },

  async tags(): Promise<EBookTag[]> {
    return [
      { id: 'topic:fiction', name: 'Fiction', group: 'Topic' },
      { id: 'topic:literature', name: 'Literature', group: 'Topic' },
    ];
  },
};

harbor.register(plugin);
