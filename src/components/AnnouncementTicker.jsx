import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Megaphone } from "lucide-react";

export default function AnnouncementTicker() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    base44.entities.Announcement.filter({ active: true }, "sort_order", 20)
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  // Duplicate the row so the marquee loops seamlessly.
  const row = [...items, ...items];

  return (
    <div className="overflow-hidden bg-primary text-primary-foreground">
      <div className="flex items-center">
        <div className="flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-primary-foreground/15">
          <Megaphone className="h-3.5 w-3.5" /> News
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max whitespace-nowrap animate-marquee py-2">
            {row.map((a, i) => (
              <span key={i} className="mx-6 text-sm">
                <span className="font-medium">{a.title}</span>
                {a.body ? <span className="ml-2 text-primary-foreground/80">— {a.body}</span> : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}