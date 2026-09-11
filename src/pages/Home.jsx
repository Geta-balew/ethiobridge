import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/marketplace/Navbar";
import AnnouncementTicker from "@/components/AnnouncementTicker";
import ItemCard from "@/components/marketplace/ItemCard";
import { Zap, Package, Loader2, Plane } from "lucide-react";

const CATEGORIES = ["All", "Electronics", "Fashion", "Home & Living", "Beauty & Health", "Groceries", "Kids", "Other"];

export default function Home() {
  const [items, setItems] = useState(null);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [data, settings] = await Promise.all([
          base44.entities.Item.filter({ status: "published" }, "-created_date", 100),
          base44.entities.AppSetting.list("-created_date", 1),
        ]);
        if (active) {
          setItems(data);
          setSetting(settings[0] || null);
        }
      } catch (e) {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const deals = useMemo(() => (items || []).filter((i) => i.is_deal).slice(0, 4), [items]);
  const offers = useMemo(() => (items || []).filter((i) => i.is_offer).slice(0, 8), [items]);

  const filtered = useMemo(() => {
    let list = items || [];
    if (category !== "All") list = list.filter((i) => i.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    return list;
  }, [items, category, query]);

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementTicker />
      <Navbar onSearch={setQuery} />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-br from-amber-50 via-background to-emerald-50/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100/60 px-3 py-1 text-xs font-medium text-amber-800">
              <Plane className="h-3.5 w-3.5" /> Travel shopping, delivered to Ethiopia
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Shop from Dubai. <span className="text-amber-600">Pick up in Addis.</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Browse today's verified items, choose what you need, and we deliver to your address
              in Addis Ababa or anywhere in Ethiopia. Pay with Chapa or manually — it's that simple.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Deals of the day */}
        {deals.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold">Deals of the day</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {deals.map((item) => (
                <ItemCard key={item.id} item={item} setting={setting} />
              ))}
            </div>
          </section>
        )}

        {/* Offers */}
        {offers.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-semibold">Special offers</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {offers.map((item) => (
                <ItemCard key={item.id} item={item} setting={setting} />
              ))}
            </div>
          </section>
        )}

        {/* Category filter */}
        <section>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <h2 className="mr-2 text-xl font-semibold">All items</h2>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  category === c
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">No items found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item) => (
                <ItemCard key={item.id} item={item} setting={setting} />
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Addis Bazaar · Dubai → Addis delivery service
      </footer>
    </div>
  );
}