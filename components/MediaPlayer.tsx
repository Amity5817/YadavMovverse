// components/MediaPlayer.tsx - HLS support ke saath
"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface MediaPlayerProps {
  mediaId: string;
  poster?: string;
  detailPath?: string;
  se?: string;
  ep?: string;
}

export default function MediaPlayer({ 
  mediaId, 
  poster, 
  detailPath = '',
  se = '1',
  ep = '1'
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaId) {
      setError("No media ID provided");
      setLoading(false);
      return;
    }

    async function fetchVideoUrl() {
      try {
        setLoading(true);
        setError(null);

        const streamUrl = `/api/stream/${mediaId}?detail_path=${encodeURIComponent(detailPath)}&se=${se}&ep=${ep}`;
        console.log("🎬 Fetching from:", streamUrl);

        const response = await fetch(streamUrl);
        const data = await response.json();
        console.log("📦 Stream response:", data);

        if (data.error) {
          throw new Error(data.error);
        }

        let url = null;
        let isHls = false;
        
        // First try HLS
        if (data.hls && data.hls.length > 0) {
          url = data.hls[0].url;
          isHls = true;
          console.log("✅ Using HLS URL:", url);
        }
        // Then try sources
        else if (data.sources && data.sources.length > 0) {
          // Sort by resolution (highest first)
          const sorted = [...data.sources].sort((a: any, b: any) => {
            const resA = parseInt(a.resolution) || 0;
            const resB = parseInt(b.resolution) || 0;
            return resB - resA;
          });
          url = sorted[0].url;
          console.log("✅ Using source URL:", url);
        }

        if (url) {
          setVideoUrl(url);
          
          // If it's HLS (.m3u8), setup HLS.js
          if (isHls || url.includes('.m3u8')) {
            console.log("📡 HLS stream detected, setting up HLS.js");
            setupHLS(url);
          }
        } else {
          throw new Error("No video URL found");
        }
      } catch (err: any) {
        console.error("❌ Error:", err);
        setError(err.message || "Failed to load video");
      } finally {
        setLoading(false);
      }
    }

    fetchVideoUrl();
  }, [mediaId, detailPath, se, ep]);

  const setupHLS = (url: string) => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          console.log("Auto-play was prevented");
        });
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data);
        setError("HLS playback error");
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {
          console.log("Auto-play was prevented");
        });
      });
    } else {
      setError("HLS not supported in this browser");
    }
  };

  useEffect(() => {
    // If videoUrl is set and it's not HLS, just set src
    if (videoUrl && videoRef.current && !videoUrl.includes('.m3u8')) {
      videoRef.current.src = videoUrl;
    }
  }, [videoUrl]);

  if (loading) {
    return (
      <div className="flex aspect-video items-center justify-center bg-zinc-900">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent"></div>
          <p className="mt-2 text-sm text-zinc-400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center bg-zinc-900 p-4">
        <div className="text-center">
          <p className="text-red-500">❌ {error}</p>
          <p className="mt-2 text-sm text-zinc-500">Media ID: {mediaId}</p>
          {videoUrl && (
            <details className="mt-4">
              <summary className="text-xs text-zinc-400 cursor-pointer">Debug Info</summary>
              <p className="mt-2 text-xs text-zinc-500 break-all">URL: {videoUrl}</p>
            </details>
          )}
        </div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center bg-zinc-900 p-4">
        <div className="text-center">
          <p className="text-yellow-500">⚠️ No video available</p>
          <p className="mt-2 text-sm text-zinc-500">Media ID: {mediaId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black">
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        poster={poster}
        controlsList="nodownload"
        playsInline
        onError={(e) => {
          console.error("Video element error:", e);
          // Check if it's a CORS or network error
          const video = e.currentTarget;
          console.log("Video error code:", video.error?.code);
          console.log("Video error message:", video.error?.message);
          setError(`Video error: ${video.error?.message || 'Unknown error'}`);
        }}
      />
    </div>
  );
}