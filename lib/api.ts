export type Cover = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  thumbnail: string;
  blurHash: string;
  gif: string | null;
  avgHueLight: string;
  avgHueDark: string;
  id: string;
};

export type SubjectItem = {
  subjectId: string;
  subjectType: number;
  title: string;
  description: string;
  releaseDate: string;
  duration: number;
  genre: string;
  cover: Cover;
  countryName: string;
  imdbRatingValue: string;
  subtitles: string;
  ops: string;
  hasResource: boolean;
  trailer: unknown | null;
  detailPath: string;
  staffList: unknown[];
  appointmentCnt: number;
  appointmentDate: string;
  corner: string;
  imdbRatingCount: number;
  stills: unknown | null;
  postTitle: string;
  season: number;
  dubs: unknown[];
  accessStrategy: unknown | null;
  webHighRisk: boolean;
};

export type SubjectFilterResponse = {
  code: number;
  message: string;
  data: {
    pager: {
      hasMore: boolean;
      nextPage: string;
      page: string;
      perPage: number;
      totalCount: number;
    };
    items: SubjectItem[];
  };
};