// types/api.ts

export interface Movie {
  id: string | number;
  title: string;
  poster?: string;
  cover?: string;
  rating?: number | string;
  year?: number | string;
  slug?: string;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface SubjectFilterResponse {
  list?: Movie[];
  total?: number;
  hasMore?: boolean;
  [key: string]: any;
}

export interface PlatformResponse {
  platforms?: any[];
  list?: any[];
  [key: string]: any;
}