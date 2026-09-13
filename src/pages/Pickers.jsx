import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Star, Plane, Package } from "lucide-react";

export default function Pickers() {
  const [pickers, setPickers] = useState(null);
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Picker.filter({ verification_status: "verified" }, "-rating", 50);
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setPickers(list);
        const revs = await base44.entities.Review.list("-created_date", 200);
        const map = {};
        revs.forEach((r) => { (map[r.picker_id] = map[r.picker_id] || []).push(r); });
        setReviews(map);
      } catch { setPickers([]); }
    })();
  }, []);

  if (pickers === null) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Our pickers</h1>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Marketplace</Link>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">Top-rated pickers are ranked first. Choose a preferred picker at checkout to prioritize your delivery.</p>

        {pickers.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No verified pickers yet.</p>
        ) : (
          <div className="grid gap-4">
            {pickers.map((p, idx) => {
              const pickerReviews = reviews[p.created_by_id] || [];
              return (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                      {(p.full_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {idx === 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">TOP PICKER</span>}
                        <p className="font-semibold">{p.full_name}</p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> {p.rating?.toFixed(1) || "0.0"} ({p.reviews_count || 0} reviews)</span>
                        <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {p.total_deliveries || 0} deliveries</span>
                        {p.flight_date && <span className="flex items-center gap-1"><Plane className="h-3.5 w-3.5" /> Next flight {p.flight_date}</span>}
                      </div>
                      {p.bio && <p className="mt-2 text-sm text-muted-foreground">{p.bio}</p>}
                    </div>
                  </div>
                  {pickerReviews.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-border pt-3">
                      {pickerReviews.slice(0, 3).map((r) => (
                        <div key={r.id} className="text-sm">
                          <span className="flex items-center gap-0.5">
                            {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />)}
                          </span>
                          <p className="mt-0.5 text-muted-foreground">"{r.comment || "Great service"}" — {r.buyer_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}