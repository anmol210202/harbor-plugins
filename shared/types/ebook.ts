/**
 * Type declarations for Harbor eBook plugins.
 */

export interface EBookTag {
  id: string;
  name: string;
  group?: string;
}

export interface EBookChapter {
  /** Chapter identifier handed back to content() */
  id: string;
  chapter?: string;
  title?: string;
  /** Zero-based reading position */
  position?: number;
  volume?: string;
  volumeTitle?: string;
  publishAt?: string;
  views?: number | string;
  pages?: number;
  language?: string;
}

export interface EBookVolume {
  volume: string;
  volumeTitle?: string;
  chapters: EBookChapter[];
}

export interface EBookSummary {
  id: string;
  title: string;
  seriesTitle?: string;
  altTitle?: string;
  altTitles?: string[];
  author?: string;
  authors?: string[];
  anilistId?: number;
  googleBooksId?: string;
  openLibraryId?: string;
  wikidataId?: string;
  isbn?: string;
  cover?: string;
  internalCover?: string;
  description?: string;
  year?: number;
  status?: string;
  originalLanguage?: string;
  genres?: string[];
  chapters?: number;
  volumes?: number;
  score?: number;
  trendingScore?: number;
  siteUrl?: string;
  isFanMade?: boolean;
}

export interface EBookProvider {
  /** Must match manifest id */
  id: string;
  name: string;

  popular(offset: number, tagId?: string): Promise<EBookSummary[]>;
  search(query: string, offset: number, tagId?: string): Promise<EBookSummary[]>;
  detail(id: string): Promise<EBookSummary | null>;
  chapters(id: string): Promise<Array<EBookChapter | EBookVolume>>;
  content(chapterId: string): Promise<string | { text?: string; images?: string[] }>;
  tags?(): Promise<EBookTag[]>;
}

export interface EBookPluginManifest {
  id: string;
  name: string;
  version: string;
  lang: string;
  nsfw: boolean;
  icon?: string;
  entry: string;
  description?: string;
  website?: string;
}

export interface EBookRepoManifest {
  type: 'ebook';
  name: string;
  description?: string;
  plugins: EBookPluginManifest[];
}
