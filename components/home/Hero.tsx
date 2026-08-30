import Link from "next/link";
import { Play, Plus } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[680px] overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=2200&q=85"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-black/20" />

      <div className="relative mx-auto flex min-h-[680px] max-w-[1500px] items-end px-5 pb-24 lg:px-8 lg:pb-28">
        <div className="max-w-2xl">
          <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur">
            Featured
          </span>

          <h1 className="mt-6 text-5xl font-black leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">
            THE
            <br />
            LAST
            <br />
            FRONTIER
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <span>2026</span>
            <span>•</span>
            <span>2h 18m</span>
            <span>•</span>
            <span className="text-green-400">98% Match</span>
            <span>•</span>
            <span>4K</span>
          </div>

          <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-300 sm:text-base">
            Humanity's final mission beyond the edge of known space
            becomes a fight for survival when an unknown signal awakens.
          </p>

          <div className="mt-8 flex gap-3">
            <Link
              href="/watch/last-frontier"
              className="flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 font-bold text-black transition hover:bg-zinc-200"
            >
              <Play size={18} fill="currentColor" />
              Watch Now
            </Link>

            <button className="flex min-h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 font-bold backdrop-blur transition hover:bg-white/20">
              <Plus size={18} />
              My List
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}