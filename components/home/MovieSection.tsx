import MovieCard from "@/components/movie/MovieCard";
import type { Movie } from "@/types/movie";

type Props = {
  title: string;
  movies: Movie[];
};

export default function MovieSection({ title, movies }: Props) {
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8 lg:py-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold sm:text-2xl">
          {title}
        </h2>

        <button className="text-sm text-zinc-500 transition hover:text-white">
          View All →
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}