"use client";

import { useState, useEffect, useRef } from "react";

interface StreamSource {
  resolution: string;
  format: string;
  url: string;
  size?: number;
}

interface Caption {
  languageName: string;
  url: string;
  language: string;
}

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  subjectId?: string;
  detailPath?: string;
  season?: number;
  episode?: number;
}

export default function VideoPlayer({
  src,
  poster,
  subjectId,
  detailPath,
  season = 1,
  episode = 1,
}: VideoPlayerProps) {
  const [sources, setSources] = useState<StreamSource[]>([]);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [selectedStream, setSelectedStream] = useState<string>(src ?? "");
  const [loading, setLoading] = useState<boolean>(!src);
  const [error, setError] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Direct video URL mode
    if (src) {
      setSelectedStream(src);
      setLoading(false);
      setError("");
      return;
    }

    // API stream mode
    if (!subjectId || !detailPath) {
      setLoading(false);
      setError("Video source is not available.");
      return;
    }

    const currentSubjectId = subjectId;
    const currentDetailPath = detailPath;

    

      async function fetchStreamAndCaptions() {
        if (!currentSubjectId || !currentDetailPath) {
          setLoading(false);
          setError("Video source is not available.");
          return;
        }

        setLoading(true);
        setError("");
        setSelectedStream("");

        try {
          const streamRes = await fetch(
            `/api/stream/${currentSubjectId}?detail_path=${encodeURIComponent(
              currentDetailPath
            )}&se=${season}&ep=${episode}`
          );

          if (!streamRes.ok) {
            throw new Error("Failed to fetch stream");
          }

          const streamData = await streamRes.json();

          if (
            streamData.has_resource &&
            streamData.sources?.length > 0
          ) {
            setSources(streamData.sources);
            setSelectedStream(streamData.sources[0].url);
          } else {
            setError(
              "Stream sources not available for this episode."
            );
          }

          const capRes = await fetch(
            `/api/stream/${subjectId}/captions?detail_path=${encodeURIComponent(
              detailPath
            )}&se=${season}&ep=${episode}`
          );

          if (capRes.ok) {
            const capData = await capRes.json();

            if (capData.captions) {
              setCaptions(capData.captions);
            }
          }
        } catch (err) {
          console.error("Video player error:", err);
          setError("Failed to load player data from server.");
        } finally {
          setLoading(false);
        }
      }

      fetchStreamAndCaptions();
    }, [src, subjectId, detailPath, season, episode]);

  const handleQualityChange = (newUrl: string) => {
    if (!videoRef.current || newUrl === selectedStream) {
      return;
    }

    const currentTime = videoRef.current.currentTime;
    const isPlaying = !videoRef.current.paused;

    setSelectedStream(newUrl);

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;

        if (isPlaying) {
          videoRef.current.play().catch(() => { });
        }
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center rounded-2xl bg-zinc-900 text-white">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
          <p className="text-sm text-zinc-400">
            Loading stream & subtitles...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 text-rose-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-2xl">
        <video
          ref={videoRef}
          controls
          autoPlay
          poster={poster}
          className="h-full w-full object-contain"
          src={selectedStream}
        >
          {captions.map((cap, idx) => (
            <track
              key={idx}
              kind="subtitles"
              src={cap.url}
              srcLang={cap.language || "en"}
              label={cap.languageName || `Track ${idx + 1}`}
              default={idx === 0}
            />
          ))}

          Your browser does not support the video tag.
        </video>
      </div>

      {sources.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-white">
          <div>
            <h4 className="text-sm font-semibold text-zinc-300">
              Video Quality
            </h4>

            <p className="text-xs text-zinc-500">
              Select preferred resolution
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {sources.map((stream, index) => (
              <button
                key={index}
                onClick={() =>
                  handleQualityChange(stream.url)
                }
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${selectedStream === stream.url
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
              >
                {stream.resolution} ({stream.format})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}