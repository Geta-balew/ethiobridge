import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { ShoppingCart, Tag, Zap } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/use-toast";
import { computePrice, basePrice } from "@/utils/pricing";

export default function ItemCard({ item, setting }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const final = computePrice(item, setting);
  const original = basePrice(item, setting);
  const hasDiscount = final < original;
  const discountPct = hasDiscount ? Math.round(((original - final) / original) * 100) : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ ...item, price: final, discounted_price: null }, 1);
    toast({ title: "Added to cart", description: item.title });
  };

  return (
    <Link
      to={`/item/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {item.images?.[0] ? (
          <Image
            src={item.images[0]}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            fittingType="fill"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-10 w-10" />
          </div>
        )}
        {item.is_deal && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
            <Zap className="h-3 w-3" /> Deal
          </span>
        )}
        {hasDiscount && !item.is_deal && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
            <Tag className="h-3 w-3" /> {discountPct}% OFF
          </span>
        )}
        {item.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="text-sm font-medium text-foreground">Out of stock</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <span className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {item.category}
        </span>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {item.title}
        </h3>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {original.toLocaleString()} ETB
              </span>
            )}
            <span className="text-base font-semibold text-foreground">
              {final.toLocaleString()} ETB
            </span>
          </div>
          <button
            onClick={handleAdd}
            disabled={item.stock === 0}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}