import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingCart, Tag, Zap, ArrowLeft, Loader2, Minus, Plus, ShieldCheck } from "lucide-react";
import { computePrice, basePrice, itemPickerFee } from "@/utils/pricing";

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [setting, setSetting] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [data, settings] = await Promise.all([
          base44.entities.Item.get(id),
          base44.entities.AppSetting.list("-created_date", 1),
        ]);
        setItem(data);
        setSetting(settings[0] || null);
      } catch {
        setItem(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Item not found.</p>
        <Link to="/" className="text-primary underline">Back to marketplace</Link>
      </div>
    );
  }

  const final = computePrice(item, setting);
  const original = basePrice(item, setting);
  const hasDiscount = final < original;
  const discountPct = hasDiscount ? Math.round(((original - final) / original) * 100) : 0;
  const images = item.images?.length ? item.images : [];
  const pricedItem = { ...item, price: final, discounted_price: null, picker_fee: itemPickerFee(item) };

  const handleAdd = () => {
    addItem(pricedItem, qty);
    toast({ title: "Added to cart", description: `${qty} × ${item.title}` });
  };

  const buyNow = () => {
    addItem(pricedItem, qty);
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
              {images[activeImg] ? (
                <Image src={images[activeImg]} alt={item.title} className="h-full w-full object-cover" fittingType="fill" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ShoppingCart className="h-12 w-12" />
                </div>
              )}
              {item.is_deal && (
                <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                  <Zap className="h-3.5 w-3.5" /> Deal of the day
                </span>
              )}
              {hasDiscount && !item.is_deal && (
                <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">
                  <Tag className="h-3.5 w-3.5" /> {discountPct}% OFF
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(idx)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                      idx === activeImg ? "border-primary" : "border-border"
                    }`}
                  >
                    <Image src={img} alt="" className="h-full w-full object-cover" fittingType="fill" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.category}</span>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{item.title}</h1>

            <div className="mt-4 flex items-end gap-3">
              <span className="text-3xl font-semibold">
                {final.toLocaleString()} ETB
              </span>
              {hasDiscount && (
                <span className="text-lg text-muted-foreground line-through">{original.toLocaleString()} ETB</span>
              )}
            </div>
            {itemPickerFee(item) > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">Includes {itemPickerFee(item).toLocaleString()} ETB picker delivery fee</p>
            )}

            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                item.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}>
                {item.stock > 0 ? `In stock (${item.stock})` : "Out of stock"}
              </span>
            </div>

            {item.description && (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{item.description}</p>
            )}

            {/* Quantity */}
            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center rounded-full border border-border">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center hover:bg-muted">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(item.stock || 99, q + 1))} className="flex h-9 w-9 items-center justify-center hover:bg-muted">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={buyNow}
                disabled={item.stock === 0}
                className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
              >
                Buy now
              </button>
              <button
                onClick={handleAdd}
                disabled={item.stock === 0}
                className="flex-1 rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:bg-muted disabled:opacity-40"
              >
                Add to cart
              </button>
            </div>

            <div className="mt-6 flex items-start gap-2 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p>Verified item. Delivery available to Addis Ababa and rural areas across Ethiopia after your Dubai → Addis flight.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}