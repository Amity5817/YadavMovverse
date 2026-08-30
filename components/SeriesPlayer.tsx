"use client";

import { useState } from "react";
import VideoPlayer from "./VideoPlayer";
import EpisodeSelector, {
  type Episode,
  type Season,
} from "./EpisodeSelector";

type Props = {
  seasons: Season[];
  poster?: string;
  getVideoUrl: (
    season: number,
    episode: number
  ) => string | null;
};

export default function SeriesPlayer({
  seasons,
  poster,
  getVideoUrl,
}: Props) {
  const firstSeason = seasons[0];
  const firstEpisode = firstSeason?.episodes[0];

  const [selected, setSelected] = useState({
    season: firstSeason?.number ?? 1,
    episode: firstEpisode?.number ?? 1,
  });

  const videoUrl = getVideoUrl(
    selected.season,
    selected.episode
  );

  function handleSelect(
    episode: Episode,
    season: number
  ) {
    setSelected({
      season,
      episode: episode.number,
    });
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Now Playing
        </h2>

        <span className="text-sm text-zinc-500">
          S{selected.season} · E{selected.episode}
        </span>
      </div>

      <VideoPlayer
        src={videoUrl ?? ""}
        poster={poster}
      />

      <EpisodeSelector
        seasons={seasons}
        onSelect={handleSelect}
      />
    </section>
  );
}