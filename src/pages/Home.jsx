import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/marketplace/Navbar";
import AnnouncementTicker from "@/components/AnnouncementTicker";
import ItemCard from "@/components/marketplace/ItemCard";
import HeroCarousel from "@/components/marketplace/HeroCarousel";
import ProductRow from "@/components/marketplace/ProductRow";
import { useLang } from "@/context/LanguageContext";
import { Image } from "@/components/ui/image";
import { Zap, Truck, ShieldCheck, BadgeCheck, Headphones, Loader2, Plane } from "lucide-react";

const CATEGORIES = ["All", "Electronics", "Fashion", "Home & Living", "Beauty & Health", "Groceries", "Kids", "Other"];
const CAT_IMAGES = {
  Electronics: "https://images.unsplash.com/photo-1498084393758-b525456b8e6e",
  Fashion: "https://images.unsplash.com/photo-1445205170238-2153ab1c2fe6",
  "Home & Living": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
  "Beauty & Health": "https://images.unsplash.com/photo-1596462502278-27bfdc0ae0c5",
  Groceries: "https://images.unsplash.com/photo-1542838132-2c5c19249e5f",
  Kids: "https://images.unsplash.com/photo-1561347034-1c3f4c5d4e6b",
  Other: "https://images.unsplash.com/photo-1513152697234-4731ddb6952e",
};
const CAT_KEYS = {
  Electronics: "electronics", Fashion: "fashion", "Home & Living": "home_living",
  "Beauty & Health": "beauty_health", Groceries: "groceries", Kids: "kids", Other: "other",
};

export default function Home() {
  const { t } = useLang();
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
        if (active) { setItems(data); setSetting(settings[0] || null); }
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const deals = useMemo(() => (items || []).filter((i) => i.is_deal), [items]);
  const electronics = useMemo(() => (items || []).filter((i) => i.category === "Electronics"), [items]);
  const watches = useMemo(() => (items || []).filter((i) => /watch|rolex|submariner/i.test(i.title || "")), [items]);
  const shoesPerfumes = useMemo(
    () => (items || []).filter((i) => /nike|adidas|shoe|sneaker|perfume|dior|sauvage|fragrance|cologne/i.test(i.title || "") || ["Fashion", "Beauty & Health"].includes(i.category)).slice(0, 12),
    [items]
  );

  const filtered = useMemo(() => {
    let list = items || [];
    if (category !== "All") list = list.filter((i) => i.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    return list;
  }, [items, category, query]);

  const slides = [
    { image: "https://images.unsplash.com/photo-1518770660439-4636190af475", title: t("upgrade_everyday"), sub: t("upgrade_sub"), badges: [t("top_brands"), "100% Original", t("fast_delivery")] },
    { image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff", title: t("step_style"), sub: t("step_style_sub"), badges: [t("top_brands"), "Easy Returns"] },
    { image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30", title: t("timeless"), sub: t("timeless_sub"), badges: [t("top_brands"), "Verified"] },
  ];

  const trust = [
    { icon: Truck, title: t("fast_delivery"), sub: t("fast_delivery_sub") },
    { icon: ShieldCheck, title: t("pay_on_delivery"), sub: t("pay_on_delivery_sub") },
    { icon: BadgeCheck, title: t("top_brands"), sub: t("top_brands_sub") },
    { icon: Headphones, title: t("support"), sub: t("support_sub") },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top promo banner */}
      <div className="bg-[#133827] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-4 py-2 text-center text-xs sm:text-sm">
          <span>{t("summer_sale")}</span>
          <a href="#deals" className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#133827]">{t("shop_now")}</a>
        </div>
      </div>

      <AnnouncementTicker />
      <Navbar onSearch={setQuery} />

      {/* Hero carousel */}
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <HeroCarousel slides={slides} />
      </section>

      {/* Trust bar */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 md:grid-cols-4">
          {trust.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#006633]/10 text-[#006633]"><f.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Shop by category */}
        <section className="mb-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("shop_by_category")}</h2>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-7 sm:gap-4">
            {Object.keys(CAT_IMAGES).map((c) => (
              <button key={c} onClick={() => { setCategory(c); document.getElementById("all-items")?.scrollIntoView({ behavior: "smooth" }); }} className="flex flex-col items-center gap-2">
                <Image src={CAT_IMAGES[c]} alt={c} className="h-16 w-16 rounded-full border border-border object-cover sm:h-20 sm:w-20" fittingType="fill" />
                <span className="text-center text-xs font-medium">{t(CAT_KEYS[c])}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Today's deals */}
        {deals.length > 0 && (
          <section id="deals" className="mb-10 scroll-mt-24">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold"><Zap className="h-5 w-5 text-amber-500" /> {t("todays_deals")}</h2>
              <a href="#all-items" className="text-sm font-medium text-[#006633] hover:underline">{t("see_all_deals")} →</a>
            </div>
            <ProductRow items={deals} setting={setting} />
          </section>
        )}

        {/* Electronics */}
        {electronics.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("electronics")}</h2>
            </div>
            <ProductRow items={electronics} setting={setting} />
          </section>
        )}

        {/* Watches */}
        {watches.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("watches")}</h2>
            </div>
            <ProductRow items={watches} setting={setting} />
          </section>
        )}

        {/* Shoes & Perfumes */}
        {shoesPerfumes.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("shoes_perfumes")}</h2>
            </div>
            <ProductRow items={shoesPerfumes} setting={setting} />
          </section>
        )}

        {/* All items */}
        <section id="all-items" className="scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <h2 className="mr-2 text-xl font-semibold">{t("all_items")}</h2>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3.5 py-1.5 text-sm transition ${category === c ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground hover:bg-muted"}`}>
                {c === "All" ? "All" : t(CAT_KEYS[c]) || c}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">{t("no_items")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item) => <ItemCard key={item.id} item={item} setting={setting} />)}
            </div>
          )}
        </section>

        {/* Membership promo */}
        <section className="mt-12 overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-background to-[#a8cba0]/40">
          <div className="flex flex-col items-start gap-6 p-8 md:flex-row md:items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#133827] sm:text-3xl">{t("membership_title")}</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("membership_sub")}</p>
              <button className="mt-5 rounded-full bg-[#006633] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#005528]">{t("join_now")}</button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[#133827]">
              <div className="flex items-center gap-2 text-xs font-medium"><Truck className="h-5 w-5" /> FREE Delivery</div>
              <div className="flex items-center gap-2 text-xs font-medium"><Plane className="h-5 w-5" /> Priority picker</div>
              <div className="flex items-center gap-2 text-xs font-medium"><BadgeCheck className="h-5 w-5" /> Exclusive deals</div>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        {t("footer")}
      </footer>
    </div>
  );
}