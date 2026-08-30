// app/search/page.tsx - Fix duplicate keys
"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ContentCard from "@/components/ContentCard";
import type { Content } from "@/types/content";

function SearchFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(queryParam);
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedCount, setFetchedCount] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // New states for tags
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tempTag, setTempTag] = useState("");
  const [pendingTag, setPendingTag] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  // Load saved tags from localStorage on mount
  useEffect(() => {
    const savedTags = localStorage.getItem("searchTags");
    if (savedTags) {
      try {
        setSearchTags(JSON.parse(savedTags));
      } catch (e) {
        console.error("Error loading tags:", e);
      }
    }
  }, []);

  // Save tags to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("searchTags", JSON.stringify(searchTags));
  }, [searchTags]);

  const fetchSearchResults = async (
    searchTerm: string,
    page = 1,
    append = false
  ) => {
    const trimmedSearch = searchTerm.trim();

    if (!trimmedSearch) {
      setItems([]);
      setTotalResults(0);
      setCurrentPage(0);
      setHasMore(false);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setItems([]);
      setCurrentPage(0);
      setHasMore(false);
    }

    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(
          trimmedSearch
        )}&page=${page}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Search failed: ${response.status}`
        );
      }

      const json = await response.json();
      const rawResults = json.results || [];

      const mappedItems: Content[] = rawResults.map(
        (item: any) => ({
          id: String(
            item.id ||
            item.subjectId ||
            ""
          ),

          subjectId: String(
            item.subjectId ||
            item.id ||
            ""
          ),

          title: item.title || "Untitled",

          slug:
            item.slug ||
            item.detailPath ||
            item.id ||
            "",

          detailPath:
            item.detailPath ||
            item.slug ||
            "",

          poster:
            item.poster ||
            item.cover ||
            "",

          cover:
            item.cover ||
            item.poster ||
            "",

          year: Number(item.year) || 0,

          rating:
            Number(
              item.imdbRating ||
              item.rating
            ) || 0,

          imdbRating:
            Number(
              item.imdbRating ||
              item.rating
            ) || 0,

          genre: item.genre || "",

          duration:
            item.duration || 0,

          hasResource:
            item.hasResource ?? true,

          subjectType:
            item.subjectType || 1,
        })
      );

      if (append) {
        setItems((previous) => {
          const existingIds = new Set(
            previous.map(
              (item) =>
                item.id ||
                item.subjectId
            )
          );

          const newItems =
            mappedItems.filter(
              (item) =>
                !existingIds.has(
                  item.id ||
                  item.subjectId
                )
            );

          return [
            ...previous,
            ...newItems,
          ];
        });
      } else {
        setItems(mappedItems);
      }

      setTotalResults(
        Number(json.total) || 0
      );

      setCurrentPage(page);
      setHasMore(
        Boolean(json.hasMore)
      );
    } catch (err: any) {
      console.error(
        "❌ Search fetch error:",
        err
      );

      setError(
        err?.message ||
        "Failed to fetch results"
      );

      if (!append) {
        setItems([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const loader = loaderRef.current;

    if (!loader) return;
    if (!queryParam) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];

        if (!entry.isIntersecting) return;
        if (loadingMoreRef.current) return;
        if (!hasMore) return;

        loadingMoreRef.current = true;

        try {
          await fetchSearchResults(
            queryParam,
            currentPage + 1,
            true
          );
        } finally {
          loadingMoreRef.current = false;
        }
      },
      {
        root: null,
        rootMargin: "1000px 0px",
        threshold: 0,
      }
    );

    observer.observe(loader);

    return () => {
      observer.disconnect();
    };
  }, [
    queryParam,
    currentPage,
    hasMore,
  ]);



  useEffect(() => {
    if (queryParam) {
      setQuery(queryParam);
      fetchSearchResults(
        queryParam,
        1,
        false
      );
    }
  }, [queryParam]);



  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Add current search to tags if not already present
    const trimmedQuery = query.trim();
    if (!searchTags.includes(trimmedQuery)) {
      setSearchTags([...searchTags, trimmedQuery]);
    }

    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    fetchSearchResults(trimmedQuery);
  };

  // Handle tag click - search for that tag
  const handleTagClick = (tag: string) => {
    setQuery(tag);
    router.push(`/search?q=${encodeURIComponent(tag)}`);
    fetchSearchResults(tag);
  };

  // Handle adding new tag with confirmation
  const handleAddTag = () => {
    if (!tempTag.trim()) return;
    setPendingTag(tempTag.trim());
    setShowTagInput(false);
    setTempTag("");
  };

  // Confirm and save the pending tag
  const confirmAddTag = () => {
    if (pendingTag && !searchTags.includes(pendingTag)) {
      setSearchTags([...searchTags, pendingTag]);
    }
    setPendingTag(null);
  };

  // Cancel adding tag
  const cancelAddTag = () => {
    setPendingTag(null);
    setShowTagInput(false);
    setTempTag("");
  };

  // Remove a tag (close)
  const removeTag = (tagToRemove: string) => {
    setSearchTags(searchTags.filter(tag => tag !== tagToRemove));
  };

  // Reset all tags
  const resetAllTags = () => {
    setSearchTags([]);
    localStorage.removeItem("searchTags");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold md:text-3xl">Search Movies & Series</h1>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movie or series name..."
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 border border-zinc-800 focus:border-rose-600 focus:outline-none transition-all"
            ref={inputRef}
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Tags Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Search Tags:</span>
              <button
                onClick={() => setShowTagInput(true)}
                className="text-xs text-rose-500 hover:text-rose-400 transition-colors"
              >
                + Add Tag
              </button>
            </div>
            {searchTags.length > 0 && (
              <button
                onClick={resetAllTags}
                className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Add Tag Input */}
          {showTagInput && (
            <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
              <input
                type="text"
                value={tempTag}
                onChange={(e) => setTempTag(e.target.value)}
                placeholder="Enter tag name..."
                className="flex-1 bg-transparent px-2 py-1 text-sm text-white placeholder-zinc-500 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTag();
                  if (e.key === "Escape") {
                    setShowTagInput(false);
                    setTempTag("");
                  }
                }}
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1 text-xs bg-rose-600 text-white rounded hover:bg-rose-500 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowTagInput(false);
                  setTempTag("");
                }}
                className="px-3 py-1 text-xs bg-zinc-700 text-white rounded hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Pending Tag Confirmation */}
          {pendingTag && (
            <div className="flex items-center gap-3 bg-yellow-900/30 border border-yellow-700/50 p-2 rounded-lg">
              <span className="text-sm text-yellow-300">
                Add tag "{pendingTag}"?
              </span>
              <button
                onClick={confirmAddTag}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
              >
                OK
              </button>
              <button
                onClick={cancelAddTag}
                className="px-3 py-1 text-xs bg-zinc-700 text-white rounded hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Display Tags */}
          <div className="flex flex-wrap gap-2">
            {searchTags.map((tag, index) => (
              <div
                key={`tag-${tag}-${index}`}
                className="group flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 rounded-full px-3 py-1.5 transition-all cursor-pointer"
                onClick={() => handleTagClick(tag)}
              >
                <span className="text-sm text-white">#{tag}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors ml-1"
                  title="Remove tag"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4">
        {loading ? (
          <div className="flex py-12 items-center justify-center text-zinc-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent mr-2"></div>
            Searching...
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-500">❌ Error: {error}</p>
            <button
              onClick={() => fetchSearchResults(query)}
              className="mt-4 px-6 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-sm"
            >
              Retry
            </button>
          </div>
        ) : queryParam && items.length === 0 ? (
          <p className="py-12 text-zinc-500 text-center">
            No results found for "{queryParam}"
          </p>
        ) : (
          items.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-300">
                  Results for "{queryParam || query}"
                </h2>
                <span className="text-sm text-zinc-500">
                  {fetchedCount > 0 && fetchedCount < totalResults
                    ? `${items.length} of ${totalResults} results`
                    : `${totalResults || items.length} results found`
                  }
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                {items.map((item) => (
                  <ContentCard
                    key={`${item.id}-${item.slug}`}
                    item={item}
                  />
                ))}
              </div>

              {/* INFINITE SCROLL SENTINEL */}
              <div
                ref={loaderRef}
                className="h-32 w-full"
              >
                {loadingMore && (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-400">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                    Loading more movies...
                  </div>
                )}
              </div>

              {!hasMore && items.length > 0 && (
                <div className="py-8 text-center text-sm text-zinc-500">
                  ✓ All {items.length} results loaded
                </div>
              )}

              <div
                ref={loaderRef}
                className="h-24"
              >
                {loadingMore && (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-400">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                    Loading more movies...
                  </div>
                )}
              </div>

              {!hasMore && items.length > 0 && (
                <div className="py-8 text-center text-sm text-zinc-500">
                  ✓ All {items.length} results loaded
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <Suspense fallback={<div className="text-white">Loading search...</div>}>
        <SearchFormContent />
      </Suspense>
    </main>
  );
}