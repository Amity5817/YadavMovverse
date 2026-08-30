"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";

export default function SectionPage() {
  const params = useParams();
  const id = params.id;
  
  const [items, setItems] = useState<any[]>([]);
  const [sectionName, setSectionName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/section/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setItems(data.items);
        if (data.section) setSectionName(data.section);
      })
      .catch((error) => {
        console.error("Error fetching section:", error);
      })
      .finally(() => setLoading(false));
  }, [id]);

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
        <div className="flex items-center gap-4">
          <Link href="/" className="text-rose-500 hover:text-rose-400 transition-colors">
            ← Back
          </Link>
          <h1 className="text-3xl font-extrabold text-rose-500">YADAVVERSE</h1>
        </div>
        <SearchBox />
      </header>

      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-zinc-200">
          {sectionName || "All Items"}
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item: any, i: number) => (
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
      </div>
    </main>
  );
}