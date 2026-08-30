import type { SubjectItem } from "@/lib/api";
import type { Content } from "@/types/content";

export function mapSubject(item: SubjectItem): Content {
  return {
    id: item.subjectId,
    title: item.title,
    slug: item.detailPath,
    poster: item.cover?.url ?? "",
    year: Number(item.releaseDate?.slice(0, 4)) || 0,
    rating: Number(item.imdbRatingValue) || 0,
    genre: item.genre || "Unknown",
    duration: item.duration || 0,
    hasResource: item.hasResource,
    subjectType: item.subjectType,
  };
}