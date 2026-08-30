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
  subjectId: string;
  detailPath: string;
  season?: number;
  episode?: number;
}

export default function VideoPlayer({
  subjectId,
  detailPath,
  season = 1,
  episode = 1,
}: VideoPlayerProps) {
  const [sources, setSources] = useState<StreamSource[]>([]);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function fetchStreamAndCaptions() {
      setLoading(true);
      setError("");
      setSelectedStream("");

      try {
        // 1. Fetch Streams (Video Quality Links)
        const streamRes = await fetch(
          `/api/stream/${subjectId}?detail_path=${detailPath}&se=${season}&ep=${episode}`
        );
        const streamData = await streamRes.json();

        if (streamData.has_resource && streamData.sources?.length > 0) {
          setSources(streamData.sources);
          // Set highest quality by default
          setSelectedStream(streamData.sources[0].url);
        } else {
          setError("Stream sources not available for this episode.");
        }

        // 2. Fetch Subtitles/Captions
        const capRes = await fetch(
          `/api/stream/${subjectId}/captions?detail_path=${detailPath}&se=${season}&ep=${episode}`
        );
        const capData = await capRes.json();
        if (capData.captions) {
          setCaptions(capData.captions);
        }
      } catch (err) {
        setError("Failed to load player data from server.");
      } finally {
        setLoading(false);
      }
    }

    if (subjectId && detailPath) {
      fetchStreamAndCaptions();
    }
  }, [subjectId, detailPath, season, episode]);

  // Handle Dynamic Quality Switch without losing playback time
  const handleQualityChange = (newUrl: string) => {
    if (!videoRef.current || newUrl === selectedStream) return;
    const currentTime = videoRef.current.currentTime;
    const isPlaying = !videoRef.current.paused;

    setSelectedStream(newUrl);

    // Wait for src update then restore time
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        if (isPlaying) videoRef.current.play();
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center rounded-2xl bg-zinc-900 text-white">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent mx-auto"></div>
          <p className="text-sm text-zinc-400">Loading stream & subtitles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-zinc-900/50 border border-zinc-800 text-rose-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Main Video Viewport */}
      <div className="relative overflow-hidden rounded-2xl bg-black aspect-video shadow-2xl border border-zinc-800">
        <video
          ref={videoRef}
          controls
          autoPlay
          className="h-full w-full object-contain"
          src={selectedStream}
        >
          {/* Inject Subtitle Tracks */}
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

      {/* Control Bar: Quality & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
        <div>
          <h4 className="text-sm font-semibold text-zinc-300">Video Quality</h4>
          <p className="text-xs text-zinc-500">Select preferred resolution</p>
        </div>

        {/* Dynamic Quality Selector */}
        <div className="flex flex-wrap gap-2">
          {sources.map((src, index) => (
            <button
              key={index}
              onClick={() => handleQualityChange(src.url)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedStream === src.url
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {src.resolution} ({src.format})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}