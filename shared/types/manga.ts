/**
 * Type declarations for Harbor Manga plugins.
 */

export interface MangaSummary {
  /** Required stable identifier handed back to detail and chapters */
  id: string;
  /** Canonical title */
  title: string;
  altTitle?: string;
  /** Must be an absolute http(s) URL */
  cover?: string;
  year?: number;
  status?: string;
  description?: string;
  contentRating?: string;
  lastChapter?: string;
  author?: string;
}

export interface MangaChapter {
  /** Required stable identifier handed back to pageUrls */
  id: string;
  /** Chapter number as string, or null */
  chapter: string | null;
  title?: string;
  volume?: string | null;
  /** Integer >= 0 (0 if unknown) */
  pages: number;
  /** Language ISO code (e.g. "en") */
  language: string;
  /** Scanlation group */
  group?: string;
  /** Publication date string */
  publishAt?: string;
}

export interface MangaTag {
  id: string;
  name: string;
  group?: string;
}

export type FilterTriState = "include" | "exclude" | "ignore";

export type PluginFilterItem =
  | { type: "tri-state"; id: string; name: string; state?: FilterTriState }
  | { type: "select"; id: string; name: string; values: string[]; selectedIndex?: number }
  | { type: "sort"; id: string; name: string; values: string[]; selectedIndex?: number; ascending?: boolean }
  | { type: "checkbox"; id: string; name: string; checked?: boolean }
  | { type: "text"; id: string; name: string; value?: string };

export type PluginFilterGroup = {
  id: string;
  name: string;
  filters: PluginFilterItem[];
};

export type PluginPreference =
  | { key: string; label: string; type: "select"; options: string[]; default: string }
  | { key: string; label: string; type: "text"; default?: string }
  | { key: string; label: string; type: "checkbox"; default?: boolean };

export interface MangaProvider {
  /** Must match manifest id */
  id: string;
  name: string;

  popular(offset: number, tagId?: string | PluginFilterGroup[]): Promise<MangaSummary[]>;
  search(query: string, offset: number, tagId?: string | PluginFilterGroup[]): Promise<MangaSummary[]>;
  detail(id: string): Promise<MangaSummary | null>;
  chapters(id: string): Promise<MangaChapter[]>;
  pageUrls(chapterId: string): Promise<string[]>;
  tags?(): Promise<MangaTag[]>;
  getFilters?(): Promise<PluginFilterGroup[]>;
  preferences?: PluginPreference[];
}

export interface MangaPluginManifest {
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

export interface MangaRepoManifest {
  name: string;
  description?: string;
  plugins: MangaPluginManifest[];
}
