import ContentCard from "./ContentCard";
import type { Content } from "@/types/content";

type Props = {
  title: string;
  items: Content[];
};

export default function ContentRow({ title, items }: Props) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white md:text-2xl">
          {title}
        </h2>

        <button className="text-sm text-zinc-400 hover:text-white">
          See All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}