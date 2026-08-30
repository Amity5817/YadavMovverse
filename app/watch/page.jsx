"use client";

import { useSearchParams } from "next/navigation";
import HlsVideoPlayer from "@/components/HlsVideoPlayer";
import { Suspense } from "react";

function WatchContent() {
  const searchParams = useSearchParams();

  // Dynamic values URL search params se pick kar rahe hain
  const subjectId = searchParams.get("subject_id") || "56988683026712168";
  const slug = searchParams.get("slug") || "attack-on-titan-hindi-kGWQOIx0d4";
  const season = Number(searchParams.get("se")) || 1;
  const episode = Number(searchParams.get("ep")) || 1;

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white space-y-6">
      <HlsVideoPlayer
        subjectId={subjectId}
        detailPath={slug}
        season={season}
        episode={episode}
      />
    </main>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent"></div>
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}