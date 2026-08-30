// app/api/search/route.ts - Fetch ALL pages until complete
import { NextResponse } from "next/server";
import { makeApiRequest } from "@/lib/moviebox";

const API_BASE = "https://h5-api.aoneroom.com/wefeed-h5api-bff";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ results: [], total: 0, allLoaded: true });
  }

  try {
    console.log(`🔍 Searching for: "${q}"`);
    
    let allItems: any[] = [];
    let currentPage = 1;
    let hasMore = true;
    let totalCount = 0;
    let maxPages = 50; // Maximum pages to fetch

    while (hasMore && currentPage <= maxPages) {
      console.log(`📡 Fetching page ${currentPage}...`);
      
      const data = await makeApiRequest(
        `${API_BASE}/subject/search`,
        "POST",
        { 
          keyword: q, 
          page: currentPage, 
          pageSize: 24
        }
      );

      const items = data?.data?.items || [];
      totalCount = data?.data?.pager?.totalCount || 0;
      hasMore = data?.data?.pager?.hasMore || false;

      console.log(`✅ Page ${currentPage}: ${items.length} items, HasMore: ${hasMore}, Total: ${totalCount}`);

      allItems = [...allItems, ...items];

      // ✅ Stop conditions
      if (items.length === 0) {
        console.log("⚠️ No items in this page, stopping...");
        break;
      }

      // ✅ If we've fetched all items
      if (allItems.length >= totalCount && totalCount > 0) {
        console.log("✅ All items fetched!");
        hasMore = false;
        break;
      }

      // ✅ If no more pages according to API
      if (!hasMore) {
        console.log("✅ No more pages (hasMore=false)");
        break;
      }

      currentPage++;

      // ✅ Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`🎯 Final: ${allItems.length} items out of ${totalCount}`);

    const results = allItems.map((item: any) => {
      const subject = item.subject || item;
      return {
        id: String(subject.subjectId || subject.id || item.subjectId || item.id || ""),
        subjectId: String(subject.subjectId || subject.id || item.subjectId || item.id || ""),
        title: subject.title || item.title || subject.name || "",
        slug: subject.detailPath || item.detailPath || subject.slug || "",
        detailPath: subject.detailPath || item.detailPath || subject.slug || "",
        poster: getImageUrl(subject.cover) || getImageUrl(subject.poster) || "",
        cover: getImageUrl(subject.cover) || getImageUrl(subject.poster) || "",
        year: subject.year || item.year || "",
        rating: parseFloat(subject.imdbRatingValue || subject.rating || item.rating || 0),
        imdbRating: parseFloat(subject.imdbRatingValue || subject.rating || item.rating || 0),
        subjectType: subject.subjectType || item.subjectType || 1,
        hasResource: true,
        genre: "",
        duration: 0,
      };
    }).filter((item: any) => item.title && (item.id || item.slug));

    // ✅ Check if all loaded
    const allLoaded = results.length >= totalCount || results.length === 0;

    return NextResponse.json({ 
      results,
      total: totalCount,
      fetched: results.length,
      pagesFetched: currentPage,
      allLoaded: allLoaded,
      hasMore: hasMore,
      remaining: totalCount - results.length
    });

  } catch (error: any) {
    console.error("❌ SEARCH ERROR:", error);
    return NextResponse.json({ 
      results: [],
      total: 0,
      error: error.message,
      allLoaded: true
    });
  }
}

function getImageUrl(url: any): string {
  if (!url) return "";
  if (typeof url === 'object' && url.url) {
    const imgUrl = url.url;
    if (imgUrl.startsWith('http')) return imgUrl;
    if (imgUrl.startsWith('/')) return `https://h5-api.aoneroom.com${imgUrl}`;
    return `https://h5-api.aoneroom.com/${imgUrl}`;
  }
  if (typeof url === 'string') {
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `https://h5-api.aoneroom.com${url}`;
    return `https://h5-api.aoneroom.com/${url}`;
  }
  return "";
}