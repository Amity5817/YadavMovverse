// app/api/search/route.ts

import { NextResponse } from "next/server";
import { makeApiRequest } from "@/lib/moviebox";

const API_BASE =
  "https://h5-api.aoneroom.com/wefeed-h5api-bff";

const PAGE_SIZE = 12;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q")?.trim();
  const pageParam = Number(searchParams.get("page") ?? "1");

  const page =
    Number.isInteger(pageParam) && pageParam > 0
      ? pageParam
      : 1;

  if (!q) {
    return NextResponse.json({
      results: [],
      total: 0,
      fetched: 0,
      page,
      pageSize: PAGE_SIZE,
      hasMore: false,
    });
  }

  try {
    console.log(
      `🔍 Search: "${q}" | Page: ${page}`
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

    const totalCount =
      Number(data?.data?.pager?.totalCount) || 0;

    const apiHasMore =
      Boolean(data?.data?.pager?.hasMore);

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
          genre: "",
          duration: 0,
        };
      })
      .filter(
        (item: any) =>
          item.title &&
          (item.id || item.slug)
      );

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