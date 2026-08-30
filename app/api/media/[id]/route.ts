import { NextResponse } from "next/server";

const VIDEO_API =
  process.env.VIDEO_API_URL!;

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;

    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "Media ID missing" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${VIDEO_API}/${encodeURIComponent(id)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization:
            `Bearer ${process.env.VIDEO_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Video API failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.url) {
      return NextResponse.json(
        { error: "Video URL missing" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      url: data.url,
    });
  } catch (error) {
    console.error("MEDIA API ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load video" },
      { status: 500 }
    );
  }
}