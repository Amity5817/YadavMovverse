// app/api/stream/[subjectId]/route.ts - Updated with better quality detection
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

  console.log(`🎬 Stream request: ${subjectId}, ${detailPath}, se=${se}, ep=${ep}`);

  try {
    // 1. Dynamic Domain Lookup
    const domData = await makeApiRequest(`${API_BASE}/media-player/get-domain`);
    const domain = (domData?.data || "https://netfilm.world").replace(/\/$/, "");

    const playerReferer = `${domain}/spa/videoPlayPage/movies/${detailPath}?id=${subjectId}&type=/movie/detail&detailSe=${se}&detailEp=${ep}&lang=en`;

    const reqHeaders = {
      ...PLAYER_HEADERS,
      Referer: playerReferer,
      Origin: domain,
    };

    // 2. Extract Dubbed Resource ID
    let resourceId = "";
    try {
      const detailRes = await fetch(
        `${domain}/wefeed-h5api-bff/detail?detailPath=${detailPath}&se=${se}`,
        { headers: reqHeaders }
      );
      const detailJson = await detailRes.json();
      const rootData = detailJson?.data || {};
      const sub = rootData.subject || rootData || {};
      const resourceDetectors = rootData.resourceDetectors || sub.resourceDetectors || [];

      if (Array.isArray(resourceDetectors) && resourceDetectors.length > 0) {
        resourceId = resourceDetectors[0].resourceId || resourceDetectors[0].id || "";
        console.log(`✅ Resource ID found: ${resourceId}`);
      }
    } catch (e) {
      console.log("⚠️ Resource extraction skipped:", e);
    }

    // 3. Multi-Attempt Stream Fetch Engine
    let playData: any = null;
    let attempts = [
      `${domain}/wefeed-h5api-bff/subject/play?subjectId=${subjectId}&se=${se}&ep=${ep}&detailPath=${detailPath}${resourceId ? `&resourceId=${resourceId}` : ""}`,
      `${domain}/wefeed-h5api-bff/subject/play?subjectId=${subjectId}&se=${se}&ep=${ep}&detailPath=${detailPath}`,
      `${domain}/wefeed-h5api-bff/subject/play?subjectId=${subjectId}&detailPath=${detailPath}`,
      `${domain}/wefeed-h5api-bff/subject/play?subjectId=${subjectId}`,
      `${domain}/wefeed-h5api-bff/media-player/get-play-info?mediaId=${subjectId}`,
    ];

    for (const url of attempts) {
      try {
        console.log(`📡 Trying: ${url}`);
        const res = await fetch(url, { headers: reqHeaders, cache: "no-store" });
        const json = await res.json();
        console.log(`📦 Response from ${url}:`, JSON.stringify(json, null, 2).substring(0, 500));
        
        if (json?.data?.sources?.length || json?.data?.hls?.length || json?.data?.hasResource) {
          playData = json.data;
          console.log(`✅ Found play data from: ${url}`);
          break;
        }
      } catch (err) {
        console.log(`❌ Attempt failed:`, err);
      }
    }

    if (!playData) {
      playData = {};
    }

    console.log("📦 PlayData keys:", Object.keys(playData));

    // 4. Process Streams - Extract ALL Qualities
    const rawStreams = playData.sources || playData.streams || [];
    console.log(`📦 Raw streams: ${rawStreams.length} items`);

    // Quality map to store all unique qualities
    const qualityMap: Record<string, any> = {};
    const qualityList: string[] = [];

    // Process each source and detect quality
    rawStreams.forEach((source: any) => {
      if (!source.url || source.url.trim() === "") return;

      let resolution = source.resolution || source.resolutions || source.quality || source.label || '';
      
      console.log(`🔍 Processing source:`, { resolution, url: source.url.substring(0, 100) });

      // Clean and detect quality
      if (typeof resolution === 'string') {
        resolution = resolution.toLowerCase();
        
        // Extract number from resolution
        const match = resolution.match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num >= 1080) resolution = '1080p';
          else if (num >= 720) resolution = '720p';
          else if (num >= 480) resolution = '480p';
          else if (num >= 360) resolution = '360p';
          else if (num >= 240) resolution = '240p';
          else resolution = `${num}p`;
        } else if (resolution.includes('hd') || resolution.includes('fhd')) {
          resolution = '1080p';
        } else if (resolution.includes('sd')) {
          resolution = '480p';
        } else {
          resolution = '480p'; // Default fallback
        }
      } else {
        resolution = '480p';
      }

      // Store in quality map
      if (!qualityMap[resolution]) {
        qualityMap[resolution] = {
          resolution: resolution,
          url: source.url,
          format: source.format || 'mp4',
          size: source.size || 0,
        };
        qualityList.push(resolution);
        console.log(`✅ Added quality: ${resolution}`);
      }
    });

    // HLS streams (adaptive quality)
    const hlsSources = (playData.hls || [])
      .filter((h: any) => h.url && h.url.trim() !== "")
      .map((h: any) => ({
        resolution: 'auto',
        format: 'hls',
        url: h.url,
      }));

    console.log(`📦 HLS sources: ${hlsSources.length} items`);

    // If HLS is available, add it as 'auto' quality
    if (hlsSources.length > 0) {
      qualityMap['auto'] = {
        resolution: 'auto',
        url: hlsSources[0].url,
        format: 'hls',
      };
      qualityList.push('auto');
    }

    // Sort qualities: 1080p > 720p > 480p > 360p > auto
    const qualityOrder = ['1080p', '720p', '480p', '360p', '240p', 'auto'];
    const sortedQualities = qualityList.sort((a, b) => {
      const indexA = qualityOrder.indexOf(a);
      const indexB = qualityOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    // Build final sources array
    const finalSources = sortedQualities.map(q => qualityMap[q]);

    console.log(`✅ Final sources: ${finalSources.length} qualities`);
    finalSources.forEach(s => console.log(`  - ${s.resolution}: ${s.url?.substring(0, 80)}...`));

    // Get best quality for direct play
    const bestQuality = finalSources.find(s => s.resolution === '1080p') ||
                        finalSources.find(s => s.resolution === '720p') ||
                        finalSources.find(s => s.resolution === '480p') ||
                        finalSources.find(s => s.resolution === '360p') ||
                        finalSources[0];

    return NextResponse.json({
      subject_id: subjectId,
      se: Number(se),
      ep: Number(ep),
      has_resource: finalSources.length > 0 || hlsSources.length > 0,
      sources: finalSources,
      hls: hlsSources,
      bestQuality: bestQuality,
      url: bestQuality?.url || null,
      qualityCount: finalSources.length,
    });

  } catch (err: any) {
    console.error("❌ Stream error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stream source", detail: err.message },
      { status: 502 }
    );
  }
}