import { NextResponse } from "next/server";
import { serverApi } from "@/lib/server-api";

interface SuggestionSubject {
  title?: string;
  detailPath?: string;
  subjectId?: string;
}

interface SuggestionItem {
  subject?: SuggestionSubject;
  word?: string;
  title?: string;
  detailPath?: string;
  subjectId?: string;
}

interface SuggestResponse {
  data?: {
    items?: SuggestionItem[];
    list?: SuggestionItem[];
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const data = await serverApi<SuggestResponse>(
      "/subject/search-suggest",
      {
        method: "POST",
        body: {
          keyword: q,
          perPage: 8,
        },
      }
    );

    const raw =
      data.data?.items ??
      data.data?.list ??
      [];

    const suggestions = raw
      .map((item) => {
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
      })
      .filter((item) => item.title);

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