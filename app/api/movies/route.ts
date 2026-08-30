import { NextResponse } from "next/server";
import { serverApi } from "@/lib/server-api";
import type { SubjectFilterResponse } from "@/types/api";
import { mapSubject } from "@/lib/mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = Number(searchParams.get("page") ?? "1");
  const sort = searchParams.get("sort") ?? "RECOMMEND";

  
  

  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json(
      {
        code: -1,
        message: "Invalid page",
      },
      { status: 400 }
    );
  }

  try {
    const data = await serverApi<SubjectFilterResponse>(
      "/subject/filter",
      {
        method: "POST",
        body: {
          tabId: 2,
          filter: {
            sort,
            genre: "ALL",
            country: "ALL",
            year: "ALL",
            language: "ALL",
          },
          page,
          perPage: 24,
        },
      }
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Movies API error:", error);

    return NextResponse.json(
      {
        code: -1,
        message: "Failed to fetch movies",
      },
      { status: 502 }
    );
  }
}