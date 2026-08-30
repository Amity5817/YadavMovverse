"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

interface SearchResultItem {
  id: string;
  title: string;
  cover?: string;
  detailPath: string;
  year?: string;
  imdbRating?: string;
}

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce Search Logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch (e) {
        console.error("Search fetch failed", e);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Search movies, series..."
          className="w-full bg-zinc-900 text-sm text-white placeholder-zinc-500 rounded-xl px-4 py-2 border border-zinc-800 focus:outline-none focus:border-rose-600 transition-colors"
        />
        {loading && (
          <div className="absolute right-3 h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
          {results.map((item) => (
            <Link
              key={item.id}
              href={`/watch?subject_id=${item.id}&slug=${item.detailPath}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 hover:bg-zinc-800/80 transition-colors border-b border-zinc-800/50 last:border-0"
            >
              {item.cover ? (
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-10 h-14 object-cover rounded-md bg-zinc-800 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-14 bg-zinc-800 rounded-md flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                  {item.year && <span>{item.year}</span>}
                  {item.imdbRating && (
                    <span className="text-amber-400 font-medium">★ {item.imdbRating}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && !loading && results.length === 0 && query.trim() !== "" && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center text-xs text-zinc-400 z-50">
          No title found for "{query}"
        </div>
      )}
    </div>
  );
}