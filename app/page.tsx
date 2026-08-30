"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";

export default function HomePage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((data) => {
        if (data.sections) setSections(data.sections);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 space-y-8">
      <header className="flex justify-between items-center max-w-7xl mx-auto border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-extrabold text-rose-500">YADAVMovieVERSE</h1>
        <Link href="/search" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">
          Search Movies
        </Link>
        {/* <SearchBox /> */}
      </header>

      <div className="max-w-7xl mx-auto space-y-10">
        {sections.map((sec, idx) => (
          <section key={idx} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-200">{sec.section}</h2>
              <Link
                href={`/section/${idx}`}  // Using index as section ID
                className="text-sm text-rose-500 hover:text-rose-400 transition-colors font-medium"
              >
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sec.items?.slice(0, 6).map((item: any, i: number) => (
                <Link
                  key={i}
                  href={`/watch?subject_id=${item.subject_id}&slug=${item.slug}`}
                  className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-rose-500 transition-all"
                >
                  <img
                    src={item.poster_url}
                    alt={item.name}
                    className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-2 text-xs truncate font-semibold text-zinc-300">
                    {item.name}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}