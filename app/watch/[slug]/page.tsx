// app/watch/[slug]/page.tsx - Fixed for movies
import Link from "next/link";
import { notFound } from "next/navigation";
import HlsVideoPlayer from "@/components/HlsVideoPlayer";
import { makeApiRequest } from "@/lib/moviebox";

type Props = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    id?: string;
    se?: string;
    ep?: string;
  }>;
};

async function getDetail(slug: string) {
  const API_BASE =
    "https://h5-api.aoneroom.com/wefeed-h5api-bff";

  const url =
    `${API_BASE}/detail?detailPath=${encodeURIComponent(slug)}` +
    `&se=1&ep=1`;

  console.log("🔍 WATCH DETAIL URL:", url);

  const data = await makeApiRequest(url);

  console.log("✅ WATCH DETAIL DATA:", {
    hasData: !!data?.data,
    subjectId: data?.data?.subject?.subjectId,
    title: data?.data?.subject?.title,
    hasResource: data?.data?.subject?.hasResource,
  });

  if (!data?.data) {
    throw new Error("Detail API returned no data");
  }

  return data;
}

export default async function WatchPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { id, se, ep } = await searchParams;

  console.log("🎬 WATCH PARAMS:", { slug, id, se, ep });

  if (!slug) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-500">Movie slug missing</h1>
          <Link href="/" className="mt-4 inline-block text-rose-500 hover:underline">
            ← Go back home
          </Link>
        </div>
      </main>
    );
  }

  let detail;
  try {
    detail = await getDetail(slug);
  } catch (error) {
    console.error("❌ Detail fetch error:", error);
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-500">Failed to load movie details</h1>
          <p className="mt-2 text-zinc-400">Please try again later</p>
          <Link href="/" className="mt-4 inline-block text-rose-500 hover:underline">
            ← Go back home
          </Link>
        </div>
      </main>
    );
  }

  const movie = detail?.data;

  if (!movie) {
    notFound();
  }

  // ✅ Extract subject type
  const subjectType = movie?.subjectType || movie?.subject?.subjectType || 1;
  const isMovie = subjectType === 1;

  console.log(`📽️ Subject Type: ${subjectType} (${isMovie ? 'Movie' : 'Series'})`);

  // ✅ For Movies: se=1, ep=1 (default)
  // ✅ For Series: use provided se/ep
  const subjectId = id || movie?.subjectId || movie?.id || "";
  const detailPath = movie?.detailPath || movie?.subject?.detailPath || slug;

  // ✅ Movies always use season=1, episode=1
  const season = isMovie ? 1 : (se ? parseInt(se) : 1);
  const episode = isMovie ? 1 : (ep ? parseInt(ep) : 1);

  // Movie info
  const title = movie?.title || movie?.subject?.title || "Movie";
  const poster = movie?.cover?.url || movie?.subject?.cover?.url || "";
  const description = movie?.description || movie?.subject?.description || "";
  const rating = movie?.imdbRatingValue || movie?.subject?.imdbRatingValue || "";
  const year = movie?.releaseDate?.slice?.(0, 4) || movie?.subject?.releaseDate?.slice?.(0, 4) || "";

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          ← Back
        </Link>

        {/* Movie Info Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              {year && <span>{year}</span>}
              {rating && (
                <span className="flex items-center gap-1 text-amber-400">
                  ★ {rating}
                </span>
              )}
              {isMovie && (
                <span className="text-xs px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full">
                  Movie
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Video Player */}
        {subjectId && detailPath ? (
          <HlsVideoPlayer
            subjectId={subjectId}
            detailPath={detailPath}
            season={season}
            episode={episode}
          />
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center bg-zinc-900 text-zinc-500 rounded-2xl">
            <p className="text-lg">No video available</p>
            <p className="mt-2 text-sm">Subject ID or Detail Path missing</p>
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="mt-8 rounded-xl bg-zinc-900/60 p-5 border border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-200">Overview</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {description}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}