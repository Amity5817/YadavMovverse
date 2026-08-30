import Link from "next/link";
import { Play } from "lucide-react";
import type { Movie } from "@/types/movie";

export default function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      href={`/movie/${movie.id}`}
      className="group block min-w-[145px] sm:min-w-[180px] lg:min-w-[210px]"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-900">
        <img
          src={movie.poster}
          alt={movie.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition duration-300 group-hover:bg-black/50 group-hover:opacity-100">
          <span className="rounded-full bg-white p-3 text-black">
            <Play size={20} fill="currentColor" />
          </span>
        </div>

        <span className="absolute left-2 top-2 rounded-md bg-black/75 px-2 py-1 text-xs font-semibold">
          ★ {movie.rating.toFixed(1)}
        </span>
      </div>

      <h3 className="mt-3 truncate text-sm font-semibold text-white">
        {movie.title}
      </h3>

      <p className="mt-1 text-xs text-zinc-500">
        {movie.year}
        {movie.genre && ` • ${movie.genre}`}
      </p>
    </Link>
  );
}