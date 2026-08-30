// app/api/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const videoUrl = request.nextUrl.searchParams.get("url");

  if (!videoUrl) {
    return NextResponse.json({ error: "No video URL provided" }, { status: 400 });
  }

  // Check if URL is empty or invalid
  if (videoUrl.trim() === "" || videoUrl === "null" || videoUrl === "undefined") {
    return NextResponse.json({ error: "Invalid video URL" }, { status: 400 });
  }

  try {
    const rangeHeader = request.headers.get("range");

    const response = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
        "Referer": "https://moviebox.ph/",
        "Origin": "https://moviebox.ph",
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        ...(rangeHeader ? { Range: rangeHeader } : {}),
      },
    });

    if (!response.ok && response.status !== 206) {
      console.error("Proxy error:", response.status, videoUrl);
      return NextResponse.json(
        { error: `Upstream error: ${response.status}` },
        { status: response.status }
      );
    }

    const headers = new Headers();
    
    // Content Type
    const contentType = response.headers.get("content-type") || "video/mp4";
    headers.set("Content-Type", contentType);
    
    // Content Length
    if (response.headers.get("content-length")) {
      headers.set("Content-Length", response.headers.get("content-length")!);
    }
    
    // Range support
    if (response.headers.get("content-range")) {
      headers.set("Content-Range", response.headers.get("content-range")!);
    }
    
    headers.set("Accept-Ranges", "bytes");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Range, Content-Range, Accept-Encoding");
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(response.body as any, {
      status: response.status === 206 ? 206 : 200,
      headers,
    });
  } catch (err: any) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Range, Accept-Encoding",
    },
  });
}