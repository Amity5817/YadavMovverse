// types/content.ts
export interface Content {
  id: string;
  subjectId?: string; // For compatibility
  title: string;
  slug: string;
  detailPath?: string;
  poster: string;
  cover?: string;
  year: string | number;
  rating: number;
  imdbRating?: number;
  genre: string;
  duration: number;
  hasResource: boolean;
  subjectType: number;
  description?: string;
}