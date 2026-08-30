"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface StreamItem {
  resolution?: string;
  format?: string;
  url: string;
}

interface Caption {
  languageName: string;
  url: string;
  language: string;
}

interface MediaDetail {
  title?: string;
  cover?: string;
  description?: string;
  year?: string;
  imdbRating?: string;
  genres?: string[];
  isMovie?: boolean;
}

interface VideoPlayerProps {
  subjectId: string;
  detailPath: string;
  season?: number;
  episode?: number;
}

export default function HlsVideoPlayer({
  subjectId,
  detailPath,
  season: initialSeason = 1,
  episode: initialEpisode = 1,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [currentSeason, setCurrentSeason] = useState<number>(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState<number>(initialEpisode);

  const [sources, setSources] = useState<StreamItem[]>([]);
  const [hlsStreams, setHlsStreams] = useState<StreamItem[]>([]);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");

  const [mediaDetail, setMediaDetail] = useState<MediaDetail | null>(null);
  const [episodesList, setEpisodesList] = useState<number[]>([]);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([1]);

  const [activeUrl, setActiveUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");
  const [isVipUser, setIsVipUser] = useState<boolean>(false);

  // Quality order for sorting
  const qualityOrder = ['1080p', '720p', '480p', '360p', '240p', 'auto'];

  // Check VIP status on mount
  useEffect(() => {
    async function checkVip() {
      try {
        const res = await fetch('/api/vip/check');
        const data = await res.json();
        setIsVipUser(data.isVip || false);
        console.log('👑 VIP Status:', data.isVip);
      } catch (e) {
        console.log('VIP check failed, using free tier');
        setIsVipUser(false);
      }
    }
    checkVip();
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      setActiveUrl("");

      try {
        // 1. Details Fetch
        const detailRes = await fetch(`/api/detail/${detailPath}?season=${currentSeason}`);
        const detailData = await detailRes.json();

        const root = detailData?.data || {};
        const sub = root.subject || root || {};
        const resource = root.resource || {};

        const seasonsArr = resource.seasons || root.seasons || root.detailSeasons || [];
        let maxSeasonsCount = sub.seasonCount || sub.maxSe || 1;

        if (Array.isArray(seasonsArr) && seasonsArr.length > 0) {
          maxSeasonsCount = Math.max(maxSeasonsCount, seasonsArr.length);
        }
        setAvailableSeasons(Array.from({ length: maxSeasonsCount }, (_, i) => i + 1));

        let currentSeasonEpCount = 0;
        if (Array.isArray(seasonsArr) && seasonsArr[currentSeason - 1]) {
          const targetSe = seasonsArr[currentSeason - 1];
          currentSeasonEpCount =
            targetSe.maxEp ||
            targetSe.episodeCount ||
            (targetSe.episodes ? targetSe.episodes.length : 0);
        }

        if (!currentSeasonEpCount) {
          currentSeasonEpCount =
            sub.episodeCount ||
            sub.totalEpisode ||
            sub.seriesEpisodeCount ||
            root.episodeCount ||
            8;
        }

        const isMovieContent = sub.subjectType === 1 || (maxSeasonsCount === 1 && currentSeasonEpCount <= 1);
        const epNumbers = Array.from({ length: currentSeasonEpCount }, (_, i) => i + 1);

        setEpisodesList(epNumbers);
        setMediaDetail({
          title: sub.title || sub.name,
          cover: sub.cover?.url,
          description: sub.description || sub.introduction || sub.summary,
          year: sub.releaseDate ? sub.releaseDate.slice(0, 4) : sub.year,
          imdbRating: sub.imdbRatingValue || sub.score,
          genres: sub.genres || (sub.tags ? sub.tags.map((t: any) => t.name) : []),
          isMovie: isMovieContent,
        });

        // 2. Fetch Stream Sources
        const streamRes = await fetch(
          `/api/stream/${subjectId}?detail_path=${detailPath}&se=${currentSeason}&ep=${currentEpisode}`
        );
        const streamData = await streamRes.json();

        console.log("📦 Stream Data:", streamData);

        if (streamData.has_resource || (streamData.sources && streamData.sources.length > 0)) {
          // Filter valid URLs
          const rawMp4 = (streamData.sources || []).filter(
            (s: StreamItem) => s.url && typeof s.url === "string" && s.url.trim() !== ""
          );

          // Remove duplicates by resolution
          const uniqueMp4Map = new Map();
          rawMp4.forEach((item: StreamItem) => {
            const res = item.resolution || '480p';
            if (!uniqueMp4Map.has(res)) {
              uniqueMp4Map.set(res, item);
            }
          });

          const validMp4: StreamItem[] = Array.from(uniqueMp4Map.values());
          const validHls = (streamData.hls || []).filter(
            (s: StreamItem) => s.url && typeof s.url === "string" && s.url.trim() !== ""
          );

          // Sort MP4 sources by quality (highest first)
          const sortedMp4 = validMp4.sort((a, b) => {
            const aRes = a.resolution || '360p';
            const bRes = b.resolution || '360p';
            return qualityOrder.indexOf(aRes) - qualityOrder.indexOf(bRes);
          });

          // Sort HLS sources
          const sortedHls = validHls.sort((a: StreamItem, b: StreamItem) => {
            const aRes = a.resolution || 'auto';
            const bRes = b.resolution || 'auto';
            return qualityOrder.indexOf(aRes) - qualityOrder.indexOf(bRes);
          });

          setSources(sortedMp4);
          setHlsStreams(sortedHls);

          // AUTO-SELECT BEST QUALITY
          let selectedUrl = null;
          let selectedQualityLabel = 'auto';

          // Try HLS first (better streaming)
          if (sortedHls.length > 0) {
            selectedUrl = sortedHls[0].url;
            selectedQualityLabel = sortedHls[0].resolution || 'auto';
          }
          // Then try MP4 sources
          else if (sortedMp4.length > 0) {
            // Try 1080p first (only if VIP), then 720p, 480p, 360p
            const qualityPriority = ['1080p', '720p', '480p', '360p', '240p'];
            let selected = null;

            for (const q of qualityPriority) {
              // Skip 1080p if not VIP
              if (q === '1080p' && !isVipUser) continue;
              
              const found = sortedMp4.find(s => s.resolution === q);
              if (found) {
                selected = found;
                selectedQualityLabel = q;
                break;
              }
            }

            // If no quality match, take first available (skip 1080p if not VIP)
            if (!selected) {
              const available = isVipUser 
                ? sortedMp4 
                : sortedMp4.filter(s => s.resolution !== '1080p');
              selected = available[0];
              selectedQualityLabel = selected?.resolution || '480p';
            }

            if (selected) {
              selectedUrl = `/api/proxy?url=${encodeURIComponent(selected.url)}`;
            }
          }

          if (selectedUrl) {
            setActiveUrl(selectedUrl);
            setSelectedQuality(selectedQualityLabel);
            console.log(`🎯 Selected quality: ${selectedQualityLabel}`);
          } else {
            setError("No playable video source found.");
          }
        } else {
          setError("Episode stream resource not found.");
        }

        // 3. Captions
        try {
          const capRes = await fetch(
            `/api/stream/${subjectId}/captions?detail_path=${detailPath}&se=${currentSeason}&ep=${currentEpisode}`
          );
          const capData = await capRes.json();

          if (capData.captions && Array.isArray(capData.captions) && capData.captions.length > 0) {
            const parsedCaptions = capData.captions.map((c: any) => {
              const rawCapUrl = c.url || c.fileUrl || "";
              const proxiedCapUrl = rawCapUrl ? `/api/proxy?url=${encodeURIComponent(rawCapUrl)}` : "";

              return {
                languageName: c.languageName || c.lang || c.name || "English",
                url: proxiedCapUrl,
                language: c.language || c.langCode || "en",
              };
            });

            setCaptions(parsedCaptions);
            setSelectedSubtitle(parsedCaptions[0].language);
          } else {
            setCaptions([]);
            setSelectedSubtitle("");
          }
        } catch (capErr) {
          console.log("Captions not available");
          setCaptions([]);
        }
      } catch (err) {
        console.error("❌ Load error:", err);
        setError("Error connecting to media server.");
      } finally {
        setLoading(false);
      }
    }

    if (subjectId && detailPath) {
      loadData();
    }
  }, [subjectId, detailPath, currentSeason, currentEpisode, isVipUser]);

  // Video Player Mount / Load Handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeUrl) return;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = activeUrl.includes(".m3u8");

    if (isHls && Hls.isSupported()) {
      console.log("📡 Loading HLS stream:", activeUrl);
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(activeUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => { });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data);
        if (data.fatal) {
          setError("HLS playback error. Try a different quality.");
        }
      });
    } else if (isHls) {
      // Native HLS (Safari)
      video.src = activeUrl;
      video.load();
      video.play().catch(() => { });
    } else {
      // MP4 direct
      console.log("📡 Loading MP4 stream:", activeUrl);
      video.src = activeUrl;
      video.load();
      video.play().catch(() => { });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeUrl]);

  // Handle quality change
  const handleQualityChange = (quality: string, url: string) => {
    setSelectedQuality(quality);
    setActiveUrl(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Title Header */}
      {mediaDetail && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
              {mediaDetail.title || "Untitled"}
            </h1>

            {mediaDetail.imdbRating && (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/20">
                <span>★</span>
                <span>{mediaDetail.imdbRating}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            {mediaDetail.year && <span>{mediaDetail.year}</span>}
            {!mediaDetail.isMovie && (
              <>
                <span>•</span>
                <span className="font-semibold text-rose-400">
                  Season {currentSeason} • Episode {currentEpisode}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Video Viewport */}
      <div className="relative overflow-hidden rounded-2xl bg-black aspect-video shadow-2xl border border-zinc-800">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent mx-auto"></div>
              <p className="text-sm text-zinc-400">Loading media stream...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900/50 text-rose-500 p-4">
            <p className="text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            controls
            playsInline
            className="h-full w-full object-contain"
            onError={(e) => {
              console.error("Video error:", e);
              setError("Video playback error. Try a different quality.");
            }}
          >
            {captions.map((cap, idx) => (
              <track
                key={idx}
                kind="subtitles"
                src={cap.url}
                srcLang={cap.language || "en"}
                label={cap.languageName || `Option ${idx + 1}`}
                default={cap.language === selectedSubtitle || idx === 0}
              />
            ))}
          </video>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
        <div className="flex flex-wrap items-center gap-4">
          {/* Audio Language */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-400">Audio:</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-zinc-800 text-rose-400 font-semibold text-xs px-3 py-1.5 rounded-lg border border-zinc-700 outline-none"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
            </select>
          </div>

          {/* Subtitles */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-400">Subtitles:</label>
            <select
              value={selectedSubtitle}
              onChange={(e) => setSelectedSubtitle(e.target.value)}
              className="bg-zinc-800 text-white text-xs px-3 py-1.5 rounded-lg border border-zinc-700 outline-none"
            >
              {captions.length > 0 ? (
                captions.map((cap, i) => (
                  <option key={i} value={cap.language}>
                    {cap.languageName}
                  </option>
                ))
              ) : (
                <option value="">Off</option>
              )}
            </select>
          </div>
        </div>

        {/* Quality Selector with VIP Lock */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* VIP Badge */}
          {sources.some(s => s.resolution === '1080p') && !isVipUser && (
            <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20">
              🔒 VIP
            </span>
          )}
          {sources.some(s => s.resolution === '1080p') && isVipUser && (
            <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20">
              👑 VIP
            </span>
          )}

          {/* Quality Buttons */}
          {sources.map((src, idx) => {
            const quality = src.resolution || '480p';
            const proxied = `/api/proxy?url=${encodeURIComponent(src.url)}`;
            const isActive = activeUrl === proxied;
            const isVipOnly = quality === '1080p';
            const isLocked = isVipOnly && !isVipUser;

            return (
              <button
                key={`mp4-${idx}`}
                onClick={() => {
                  if (isLocked) {
                    alert('🔒 1080p requires VIP subscription. Upgrade to watch in HD!');
                    return;
                  }
                  handleQualityChange(quality, proxied);
                }}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all relative ${
                  isActive
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                    : isLocked
                    ? "bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                    : isVipOnly
                    ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
                disabled={isLocked}
              >
                {quality}
                {isLocked && (
                  <span className="ml-1 text-[8px]">🔒</span>
                )}
                {isVipOnly && isVipUser && (
                  <span className="ml-1 text-[8px]">👑</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Episode Navigation */}
      {!mediaDetail?.isMovie && (
        <div className="rounded-xl bg-zinc-900/60 p-5 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h3 className="text-base font-bold text-zinc-200">
              Season {currentSeason} Episodes ({episodesList.length})
            </h3>

            {availableSeasons.length > 0 && (
              <select
                value={currentSeason}
                onChange={(e) => {
                  const newSeason = Number(e.target.value);
                  setCurrentSeason(newSeason);
                  setCurrentEpisode(1);
                }}
                className="bg-zinc-800 text-rose-400 font-bold text-xs px-3 py-1.5 rounded-lg border border-zinc-700 outline-none"
              >
                {availableSeasons.map((seNum) => (
                  <option key={seNum} value={seNum}>
                    Season {seNum}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {episodesList.map((epNum) => {
              const isActive = epNum === currentEpisode;
              return (
                <button
                  key={epNum}
                  onClick={() => setCurrentEpisode(epNum)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    isActive
                      ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30"
                      : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  Ep {epNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Description */}
      {mediaDetail?.description && (
        <div className="rounded-xl bg-zinc-900/60 p-5 border border-zinc-800 space-y-2">
          <h3 className="text-sm font-semibold text-zinc-200">Overview</h3>
          <p className="text-sm leading-relaxed text-zinc-400">
            {mediaDetail.description}
          </p>
        </div>
      )}
    </div>
  );
}