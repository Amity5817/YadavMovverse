import { NextResponse } from "next/server";
import { makeApiRequest } from "@/lib/moviebox";

const API_BASE = "https://h5-api.aoneroom.com/wefeed-h5api-bff";

const ADULT_KEYWORDS = [
  "xxx", "adult", "18+", "nsfw", "explicit", 
  "uncensored", "mature", "hentai", "erotic"
];

function isAdultSection(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return ADULT_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sectionIndex = parseInt(id, 10);
    
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
        sections.push({ section: title, count: items.length, items });
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

    const sectionData = sections[sectionIndex];
    
    if (!sectionData) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    // Check if this is an adult section
    const isAdult = isAdultSection(sectionData.section);

    return NextResponse.json({
      section: isAdult ? `🔞 ${sectionData.section}` : sectionData.section,
      items: sectionData.items || [],
      isAdult
    });
    
  } catch (error: any) {
    console.error("Error in section API:", error);
    return NextResponse.json(
      { error: "Failed to fetch section data", detail: error.message },
      { status: 502 }
    );
  }
}