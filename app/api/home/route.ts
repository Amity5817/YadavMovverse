import { NextResponse } from "next/server";
import { makeApiRequest } from "@/lib/moviebox";

const API_BASE = "https://h5-api.aoneroom.com/wefeed-h5api-bff";

export async function GET() {
  try {
    const data = await makeApiRequest(`${API_BASE}/home?host=moviebox.ph`);
    const sections: any[] = [];

    for (const op of data?.data?.operatingList || []) {
      const opType = op.type;
      const title = op.title || "Featured";

      if (opType === "BANNER") {
        const items = (op.banner?.items || [])
          .filter((item: any) => item.title && !item.title.includes("Communities"))
          .map((item: any) => ({
            name: item.title || item.subject?.title,
            poster_url: item.image?.url || item.subject?.cover?.url,
            slug: item.detailPath || item.subject?.detailPath,
            subject_id: item.subject?.subjectId,
            badge: item.subject?.corner,
          }));
        sections.push({ section: "Banner", count: items.length, items });
      } else if (["SUBJECTS_MOVIE", "SUBJECTS_TV", "SUBJECTS_ANIMATION"].includes(opType)) {
        const items = (op.subjects || []).map((sub: any) => ({
          name: sub.title,
          poster_url: sub.cover?.url,
          slug: sub.detailPath,
          subject_id: sub.subjectId,
          badge: sub.corner,
          rating: sub.imdbRatingValue,
        }));
        sections.push({ section: title, count: items.length, items });
      }
    }

    return NextResponse.json({ status: "success", sections });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch home feed", detail: err.message }, { status: 502 });
  }
}