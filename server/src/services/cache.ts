import fs from 'node:fs';
import path from 'node:path';
import type { BookDetail, ChapterInfo } from '../types.js';

const CACHE_DIR = process.env.CACHE_DIR || path.resolve(process.cwd(), '.cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// In-memory hot cache for instant retrieval
const memoryCache = new Map<string, { val: any; expiresAt: number }>();

function getMem<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.val as T;
}

function setMem(key: string, val: any, ttlSeconds: number = 3600) {
  memoryCache.set(key, { val, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function getBookDir(md5: string): string {
  const dir = path.join(CACHE_DIR, md5.toLowerCase());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export const CacheService = {
  hasBook(md5: string): boolean {
    const dir = path.join(CACHE_DIR, md5.toLowerCase());
    return fs.existsSync(path.join(dir, 'chapters.json'));
  },

  getBookDetail(md5: string): BookDetail | null {
    const mem = getMem<BookDetail>(`detail:${md5}`);
    if (mem) return mem;

    const file = path.join(getBookDir(md5), 'detail.json');
    if (!fs.existsSync(file)) return null;

    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      setMem(`detail:${md5}`, data);
      return data;
    } catch {
      return null;
    }
  },

  saveBookDetail(md5: string, detail: BookDetail): void {
    setMem(`detail:${md5}`, detail);
    const file = path.join(getBookDir(md5), 'detail.json');
    fs.writeFileSync(file, JSON.stringify(detail, null, 2), 'utf8');
  },

  getChapters(md5: string): ChapterInfo[] | null {
    const mem = getMem<ChapterInfo[]>(`chapters:${md5}`);
    if (mem) return mem;

    const file = path.join(getBookDir(md5), 'chapters.json');
    if (!fs.existsSync(file)) return null;

    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      setMem(`chapters:${md5}`, data);
      return data;
    } catch {
      return null;
    }
  },

  saveChapters(md5: string, chapters: ChapterInfo[]): void {
    setMem(`chapters:${md5}`, chapters);
    const file = path.join(getBookDir(md5), 'chapters.json');
    fs.writeFileSync(file, JSON.stringify(chapters, null, 2), 'utf8');
  },

  getChapterContent(md5: string, chapterId: string): string | null {
    const mem = getMem<string>(`content:${md5}:${chapterId}`);
    if (mem) return mem;

    const safeId = chapterId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const file = path.join(getBookDir(md5), `ch_${safeId}.txt`);
    if (!fs.existsSync(file)) return null;

    try {
      const data = fs.readFileSync(file, 'utf8');
      setMem(`content:${md5}:${chapterId}`, data);
      return data;
    } catch {
      return null;
    }
  },

  saveChapterContent(md5: string, chapterId: string, content: string): void {
    setMem(`content:${md5}:${chapterId}`, content);
    const safeId = chapterId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const file = path.join(getBookDir(md5), `ch_${safeId}.txt`);
    fs.writeFileSync(file, content, 'utf8');
  },
};
