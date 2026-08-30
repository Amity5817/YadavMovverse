// types/api.ts

export interface SubjectItem {
  subjectId: string;
  title: string;
  detailPath: string;
  cover?: {
    url?: string;
  };
  releaseDate?: string;
  imdbRatingValue?: string | number;
  genre?: string;
  duration?: number;
  hasResource: boolean;
  subjectType: number;
}

export interface SubjectFilterResponse {
  code?: number;
  message?: string;
  data?: {
    subjectList?: SubjectItem[];
    total?: number;
    page?: number;
    perPage?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface PlatformResponse {
  code?: number;
  message?: string;
  data?: {
    platformList?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}