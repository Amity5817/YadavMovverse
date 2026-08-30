// app/api/search/route.ts

import { NextResponse } from "next/server";
import { makeApiRequest } from "@/lib/moviebox";
import { processSearchTerm } from "@/lib/search-filter";

const API_BASE = "https://h5-api.aoneroom.com/wefeed-h5api-bff";
const PAGE_SIZE = 12;

const BLOCKED_KEYWORDS = [
  "hentai",
  "ecchi",
  "18+",
  "uncensored",
  "adult",
  "jav",
  "nsfw",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawQuery = searchParams.get("q");
  const pageParam = Number(searchParams.get("page") ?? "1");

  const page =
    Number.isInteger(pageParam) && pageParam > 0
      ? pageParam
      : 1;

  const filterResult = processSearchTerm(rawQuery);

  if (!filterResult.allowed || !filterResult.searchTerm) {
    return NextResponse.json({
      results: [],
      total: 0,
      fetched: 0,
      page,
      pageSize: PAGE_SIZE,
      hasMore: false,
      allLoaded: true,
    });
  }

  const q = filterResult.searchTerm;

  try {
    console.log(
      `🔍 Search: "${q}" (Original: "${rawQuery}" | Override: ${filterResult.override}) | Page: ${page}`
    );

    const data = await makeApiRequest(
      `${API_BASE}/subject/search`,
      "POST",
      {
        keyword: q,
        page,
        pageSize: PAGE_SIZE,
      }
    );

    const items = data?.data?.items ?? [];
    const totalCount = Number(data?.data?.pager?.totalCount) || 0;
    const apiHasMore = Boolean(data?.data?.pager?.hasMore);

    const results = items
      .map((item: any) => {
        const subject = item.subject || item;

        const id = String(
          subject.subjectId ||
            subject.id ||
            item.subjectId ||
            item.id ||
            ""
        );

        const detailPath =
          subject.detailPath ||
          item.detailPath ||
          subject.slug ||
          "";

        const title =
          subject.title ||
          item.title ||
          subject.name ||
          "";

        const genres = subject.genre || subject.genres || item.genre || "";
        const genreStr = Array.isArray(genres) 
          ? genres.join(" ").toLowerCase() 
          : String(genres).toLowerCase();

        return {
          id,
          subjectId: id,
          title,
          slug: detailPath,
          detailPath,

          poster:
            getImageUrl(subject.cover) ||
            getImageUrl(subject.poster) ||
            "",

          cover:
            getImageUrl(subject.cover) ||
            getImageUrl(subject.poster) ||
            "",

          year:
            subject.year ||
            item.year ||
            "",

          rating: Number(
            subject.imdbRatingValue ||
              subject.rating ||
              item.rating ||
              0
          ),

          imdbRating: Number(
            subject.imdbRatingValue ||
              subject.rating ||
              item.rating ||
              0
          ),

          subjectType:
            subject.subjectType ||
            item.subjectType ||
            1,

          hasResource: true,
          genre: genreStr,
          duration: 0,
        };
      })
      .filter((item: any) => {
        if (!item.title || (!item.id && !item.slug)) {
          return false;
        }

        // Agar user ne '057' code use kiya hai, toh filters bypass karke sab show karo
        if (filterResult.override) {
          return true;
        }

        const lowerTitle = item.title.toLowerCase();
        const lowerGenre = item.genre.toLowerCase();

        const isAdultContent = BLOCKED_KEYWORDS.some(
          (word) => lowerTitle.includes(word) || lowerGenre.includes(word)
        );

        if (isAdultContent) {
          return false;
        }

        return true;
      });

    const hasMore =
      apiHasMore ||
      (totalCount > 0 &&
        page * PAGE_SIZE < totalCount);

    console.log(
      `✅ Page ${page}: ${results.length} results | Total: ${totalCount} | HasMore: ${hasMore}`
    );

    return NextResponse.json({
      results,
      total: totalCount,
      fetched: results.length,
      page,
      pageSize: PAGE_SIZE,
      hasMore,
      allLoaded: !hasMore,
    });
  } catch (error: any) {
    console.error("❌ SEARCH ERROR:", error);

    return NextResponse.json(
      {
        results: [],
        total: 0,
        fetched: 0,
        page,
        pageSize: PAGE_SIZE,
        hasMore: false,
        allLoaded: true,
        error:
          error?.message ||
          "Failed to search",
      },
      { status: 502 }
    );
  }
}

function getImageUrl(url: any): string {
  if (!url) return "";

  if (
    typeof url === "object" &&
    url.url
  ) {
    const imgUrl = url.url;

    if (imgUrl.startsWith("http")) {
      return imgUrl;
    }

    if (imgUrl.startsWith("/")) {
      return `https://h5-api.aoneroom.com${imgUrl}`;
    }

    return `https://h5-api.aoneroom.com/${imgUrl}`;
  }

  if (typeof url === "string") {
    if (url.startsWith("http")) {
      return url;
    }

    if (url.startsWith("/")) {
      return `https://h5-api.aoneroom.com${url}`;
    }

    return `https://h5-api.aoneroom.com/${url}`;
  }

  return "";
}