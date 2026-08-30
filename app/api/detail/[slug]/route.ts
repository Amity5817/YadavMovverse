// Optional additions - agar chahiye toh add karna

import { NextRequest, NextResponse } from "next/server";
import { makeApiRequest } from "@/lib/moviebox";

const API_BASE = "https://h5-api.aoneroom.com/wefeed-h5api-bff";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const season = searchParams.get("season") || "1";
  const episode = searchParams.get("episode") || "1"; // Optional - episode support

  if (!slug) {
    return NextResponse.json(
      { error: "Slug is required" },
      { status: 400 }
    );
  }

  try {
    // Build URL with optional params
    let url = `${API_BASE}/detail?detailPath=${slug}&se=${season}`;
    
    // Agar episode hai toh add karo
    if (episode) {
      url += `&ep=${episode}`;
    }

    console.log("📡 Fetching detail:", url);

    const data = await makeApiRequest(url);
    
    // Check if data is valid
    if (!data || !data.data) {
      return NextResponse.json(
        { error: "No data found for this slug" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ Detail API error:", err);
    return NextResponse.json(
      { 
        error: "Failed to fetch details", 
        detail: err.message,
        slug: slug 
      },
      { status: 502 }
    );
  }
}