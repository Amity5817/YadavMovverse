import { NextResponse } from "next/server";
import { serverApi } from "@/lib/server-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const data = await serverApi("/subject/search-suggest", {
      method: "POST",
      body: {
        keyword: q,
        perPage: 8,
      },
    });

    const raw =
      data?.data?.items ??
      data?.data?.list ??
      [];

    const suggestions = raw.map((item: any) => {
      const subject = item.subject ?? {};

      return {
        title:
          subject.title ??
          item.word ??
          item.title ??
          "",
        slug:
          subject.detailPath ??
          item.detailPath ??
          "",
        subjectId:
          subject.subjectId ??
          item.subjectId ??
          "",
      };
    }).filter((item: any) => item.title);

    return NextResponse.json({
      suggestions,
    });
  } catch (error) {
    console.error("SUGGEST API ERROR:", error);

    return NextResponse.json(
      {
        suggestions: [],
        error: "Suggestions unavailable",
      },
      { status: 502 }
    );
  }
}