export interface ChapterInfo {
  id: string;
  title: string;
  position: number;
}

export interface BookDetail {
  id: string;
  title: string;
  author?: string;
  publisher?: string;
  year?: number;
  isbn?: string;
  cover?: string;
  description?: string;
  format?: string;
  fileSize?: string;
  chaptersCount?: number;
}

export interface SearchResultItem {
  id: string;
  title: string;
  author?: string;
  year?: number;
  format?: string;
  cover?: string;
  fileSize?: string;
}
