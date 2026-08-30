"use client";

import { useState } from "react";

export type Episode = {
  id: string;
  number: number;
  title?: string;
};

export type Season = {
  number: number;
  episodes: Episode[];
};

type Props = {
  seasons: Season[];
  onSelect?: (episode: Episode, season: number) => void;
};

export default function EpisodeSelector({
  seasons,
  onSelect,
}: Props) {
  const [selectedSeason, setSelectedSeason] = useState(
    seasons[0]?.number ?? 1
  );

  const season = seasons.find(
    (item) => item.number === selectedSeason
  );

  if (!seasons.length) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold">
        Episodes
      </h2>

      {/* Seasons */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
        {seasons.map((item) => (
          <button
            key={item.number}
            onClick={() =>
              setSelectedSeason(item.number)
            }
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              selectedSeason === item.number
                ? "bg-white text-black"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Season {item.number}
          </button>
        ))}
      </div>

      {/* Episodes */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-8">
        {season?.episodes.map((episode) => (
          <button
            key={episode.id}
            onClick={() =>
              onSelect?.(episode, selectedSeason)
            }
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
          >
            EP {episode.number}
          </button>
        ))}
      </div>
    </section>
  );
}