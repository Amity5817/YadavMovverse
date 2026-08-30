// components/ContentCard.tsx
import Link from "next/link";
import type { Content } from "@/types/content";

type Props = {
  item: Content;
};

export default function ContentCard({ item }: Props) {
  // Debug what we're getting
  console.log("🎴 CONTENT CARD:", {
    title: item.title,
    id: item.id,
    subjectId: item.subjectId,
    slug: item.slug,
    detailPath: item.detailPath,
    allKeys: Object.keys(item)
  });

  // Try multiple sources for slug and id
  const slug = item.slug || item.detailPath || "";
  const id = item.id || item.subjectId || "";

  // If no slug or id, log and show placeholder
  if (!slug && !id) {
    console.warn("⚠️ No slug or id for:", item.title);
    return (
      <div className="block min-w-0 opacity-50">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-900">
          <div className="flex h-full items-center justify-center text-zinc-500">
            No Image
          </div>
        </div>
        <h3 className="mt-2 line-clamp-2 text-sm font-medium text-white">
          {item.title}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">No link available</p>
      </div>
    );
  }

  // Build href - use slug if available, otherwise use id
  const href = slug 
    ? `/watch/${encodeURIComponent(slug)}?id=${encodeURIComponent(id)}`
    : `/watch/${encodeURIComponent(id)}`;

  console.log("🔗 Generated href:", href);

  return (
    <Link
      href={href}
      className="group block min-w-0"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-900">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            No Image
          </div>
        )}

        {item.rating && item.rating > 0 && (
          <div className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white">
            ★ {item.rating.toFixed(1)}
          </div>
        )}

        {item.hasResource && (
          <div className="absolute bottom-2 left-2 rounded-md bg-white px-2 py-1 text-[10px] font-bold text-black">
            PLAY
          </div>
        )}
      </div>

      <h3 className="mt-2 line-clamp-2 text-sm font-medium text-white">
        {item.title}
      </h3>

      <p className="mt-1 text-xs text-zinc-500">
        {item.year || "—"} • {item.genre || "Unknown"}
      </p>
    </Link>
  );
}