import { NextRequest, NextResponse } from "next/server";
import { makeApiRequest, PLAYER_HEADERS } from "@/lib/moviebox";

const API_BASE = "https://h5-api.aoneroom.com/wefeed-h5api-bff";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const detailPath = searchParams.get("detail_path") || "";
  const se = searchParams.get("se") || "1";
  const ep = searchParams.get("ep") || "1";

  try {
    const domData = await makeApiRequest(`${API_BASE}/media-player/get-domain`);
    const domain = (domData?.data || "https://netfilm.world").replace(/\/$/, "");

    const playerReferer = `${domain}/spa/videoPlayPage/movies/${detailPath}?id=${subjectId}&type=/movie/detail&detailSe=${se}&detailEp=${ep}&lang=en`;
    const playUrl = `${domain}/wefeed-h5api-bff/subject/play?subjectId=${subjectId}&se=${se}&ep=${ep}&detailPath=${detailPath}`;

    const playResp = await fetch(playUrl, {
      headers: {
        ...PLAYER_HEADERS,
        Referer: playerReferer,
      },
    });

    const playJson = await playResp.json();
    const playData = playJson?.data || {};

    const streams = playData.streams || [];
    const dash = playData.dash || [];

    let streamId = null;
    let streamFormat = null;

    if (streams.length > 0) {
      streamId = streams[0].id;
      streamFormat = streams[0].format || "MP4";
    } else if (dash.length > 0) {
      streamId = dash[0].id;
      streamFormat = dash[0].format || "DASH";
    }

    if (!streamId) {
      return NextResponse.json({ subject_id: subjectId, se, ep, count: 0, captions: [] });
    }

    const capUrl = `${API_BASE}/subject/caption?format=${streamFormat}&id=${streamId}&subjectId=${subjectId}&detailPath=${detailPath}`;
    const data = await makeApiRequest(capUrl);
    const inner = data?.data || {};
    const captions = Array.isArray(inner) ? inner : inner.captions || [];

    return NextResponse.json({
      subject_id: subjectId,
      se: Number(se),
      ep: Number(ep),
      count: captions.length,
      captions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch captions", detail: err.message },
      { status: 502 }
    );
  }
}