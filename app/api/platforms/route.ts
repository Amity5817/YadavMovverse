import { NextResponse } from "next/server";
import { serverApi } from "@/lib/server-api";
import type { PlatformResponse } from "@/types/api";

export async function GET() {
  try {
    const data = await serverApi<PlatformResponse>("/platforms");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Platform API error:", error);

    return NextResponse.json(
      {
        code: -1,
        message: "Failed to fetch platforms",
        data: {
          platformList: [],
        },
      },
      { status: 502 }
    );
  }
}