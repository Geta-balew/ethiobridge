import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image as Img } from "@/components/ui/image";
import { Loader2, Package, MapPin, Phone, KeyRound, CheckCircle2, Clock, Plane, Truck } from "lucide-react";

const PICKER_BADGE = {
  unassigned: "bg-muted text-muted-foreground",
  claimed: "bg-blue-100 text-blue-700",
  picked: "bg-indigo-100 text-indigo-700",
  in_transit: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const PAYMENT_BADGE = {
  paid: "bg-emerald-100 text-emerald-700",
  manual_confirmed: "bg-emerald-100 text-emerald-700",
  manual_pending: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-rose-100 text-rose-700",
};

export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const data = await base44.entities.Order.filter({ created_by_id: me.id }, "-created_date", 50);
        setOrders(data);
      } catch {
        setOrders([]);
      }
    })();
  }, []);

  if (orders === null) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">My orders</h1>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Marketplace</Link>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">You haven't placed any orders yet.</p>
            <Link to="/" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">Start shopping</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((o) => (
              <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{o.items?.length || 0} item(s) · {Number(o.total).toLocaleString()} ETB</p>
                  <div className="flex gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${PAYMENT_BADGE[o.payment_status] || ""}`}>
                      {o.payment_status?.replace("_", " ")}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${PICKER_BADGE[o.picker_status] || ""}`}>
                      {o.picker_status?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Delivery code — the buyer shows this to the picker on delivery */}
                {o.delivery_code && o.picker_status !== "delivered" && o.picker_status !== "cancelled" && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
                    <KeyRound className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-xs text-amber-800">Your delivery code — give this to your picker when you receive the item</p>
                      <p className="text-2xl font-bold tracking-[0.3em] text-amber-700">{o.delivery_code}</p>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="mt-3 space-y-2">
                  {o.items?.map((it, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {it.image && <div className="h-9 w-9 overflow-hidden rounded border border-border"><Img src={it.image} alt="" className="h-full w-full object-cover" fittingType="fill" /></div>}
                      <span className="flex-1 truncate">{it.title} × {it.quantity}</span>
                      <span className="text-muted-foreground">{Number(it.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Delivery info */}
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {o.delivery_address}{o.delivery_city ? `, ${o.delivery_city}` : ""}{o.delivery_region ? `, ${o.delivery_region}` : ""}</p>
                  <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {o.buyer_phone}</p>
                </div>

                {/* Tracking timeline */}
                <div className="mt-4">
                  <Timeline status={o.picker_status} payment={o.payment_status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Timeline({ status, payment }) {
  const steps = [
    { key: "placed", label: "Order placed", icon: CheckCircle2, done: true },
    { key: "paid", label: "Payment", icon: Clock, done: payment === "paid" || payment === "manual_confirmed" },
    { key: "picked", label: "Item picked", icon: Package, done: ["picked", "in_transit", "delivered"].includes(status) },
    { key: "in_transit", label: "In transit", icon: Plane, done: ["in_transit", "delivered"].includes(status) },
    { key: "delivered", label: "Delivered", icon: Truck, done: status === "delivered" },
  ];
  return (
    <div className="flex items-center">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${s.done ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className={`text-[10px] ${s.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${s.done && steps[i + 1].done ? "bg-emerald-600" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}