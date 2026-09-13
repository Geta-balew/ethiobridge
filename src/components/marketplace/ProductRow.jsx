import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ItemCard from "@/components/marketplace/ItemCard";

export default function ProductRow({ items, setting }) {
  const ref = useRef(null);
  if (!items || items.length === 0) return null;

  const scroll = (dir) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div ref={ref} className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <div key={item.id} className="w-40 shrink-0 sm:w-48 md:w-52">
            <ItemCard item={item} setting={setting} />
          </div>
        ))}
      </div>
      <button onClick={() => scroll(-1)} className="absolute -left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md hover:bg-muted md:flex" aria-label="Scroll left"><ChevronLeft className="h-4 w-4" /></button>
      <button onClick={() => scroll(1)} className="absolute -right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md hover:bg-muted md:flex" aria-label="Scroll right"><ChevronRight className="h-4 w-4" /></button>
    </div>
  );
}