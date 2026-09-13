import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image as Img } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Package, MapPin, Phone, KeyRound, CheckCircle2, Clock, Plane, Truck, Star, User } from "lucide-react";

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
  const [pickers, setPickers] = useState({});
  const [reviewing, setReviewing] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const me = await base44.auth.me();
      const [data, pickerList] = await Promise.all([
        base44.entities.Order.filter({ created_by_id: me.id }, "-created_date", 50),
        base44.entities.Picker.filter({ verification_status: "verified" }, "-rating", 100),
      ]);
      const map = {};
      pickerList.forEach((p) => { map[p.created_by_id] = p; });
      setPickers(map);
      setOrders(data);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => { load(); }, []);

  const submitReview = async (orderId) => {
    setSubmittingReview(orderId);
    try {
      await base44.functions.invoke("submitReview", { order_id: orderId, rating: reviewForm.rating, comment: reviewForm.comment });
      toast({ title: "Review submitted — thank you!" });
      setReviewing(null);
      setReviewForm({ rating: 5, comment: "" });
      await load();
    } catch (e) {
      toast({ title: "Failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setSubmittingReview(null);
    }
  };

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

        <div className="mb-5 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <Truck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Delivery takes <strong>2–5 days</strong> after your picker's Dubai → Addis flight lands.</p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">You haven't placed any orders yet.</p>
            <Link to="/" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">Start shopping</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((o) => {
              const picker = o.picker_id ? pickers[o.picker_id] : null;
              return (
                <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{o.items?.length || 0} item(s) · {Number(o.total).toLocaleString()} ETB</p>
                    <div className="flex gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${PAYMENT_BADGE[o.payment_status] || ""}`}>{o.payment_status?.replace("_", " ")}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${PICKER_BADGE[o.picker_status] || ""}`}>{o.picker_status?.replace("_", " ")}</span>
                    </div>
                  </div>

                  {o.delivery_code && o.picker_status !== "delivered" && o.picker_status !== "cancelled" && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <KeyRound className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-xs text-amber-800">Your delivery code — give this to your picker when you receive the item</p>
                        <p className="text-2xl font-bold tracking-[0.3em] text-amber-700">{o.delivery_code}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
                    {o.items?.map((it, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {it.image && <div className="h-9 w-9 overflow-hidden rounded border border-border"><Img src={it.image} alt="" className="h-full w-full object-cover" fittingType="fill" /></div>}
                        <span className="flex-1 truncate">{it.title} × {it.quantity}</span>
                        <span className="text-muted-foreground">{Number(it.price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {o.delivery_address}{o.delivery_city ? `, ${o.delivery_city}` : ""}{o.delivery_region ? `, ${o.delivery_region}` : ""}</p>
                    <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {o.buyer_phone}</p>
                  </div>

                  {picker && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-800"><User className="h-3.5 w-3.5" /> Your picker</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="font-medium text-emerald-900">{picker.full_name?.split(" ")[0]}</span>
                        <span className="flex items-center gap-1 text-emerald-800"><Phone className="h-3.5 w-3.5" /> {picker.phone}</span>
                        {o.picker_arrival_location && <span className="flex items-center gap-1 text-emerald-800"><MapPin className="h-3.5 w-3.5" /> {o.picker_arrival_location}</span>}
                        {picker.rating > 0 && <span className="flex items-center gap-1 text-amber-600"><Star className="h-3.5 w-3.5 fill-amber-500" /> {picker.rating.toFixed(1)}</span>}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <Timeline status={o.picker_status} payment={o.payment_status} />
                  </div>

                  {o.picker_status === "delivered" && !o.buyer_rated && (
                    <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
                      <p className="mb-2 text-sm font-medium">Rate your picker</p>
                      {reviewing === o.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button key={n} onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}>
                                <Star className={`h-6 w-6 ${n <= reviewForm.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                              </button>
                            ))}
                          </div>
                          <textarea className="h-20 w-full rounded-lg border border-input bg-background p-2 text-sm outline-none focus:border-ring" value={reviewForm.comment} onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Share your experience (optional)" />
                          <div className="flex gap-2">
                            <button onClick={() => submitReview(o.id)} disabled={submittingReview === o.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                              {submittingReview === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Submit review
                            </button>
                            <button onClick={() => setReviewing(null)} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setReviewing(o.id); setReviewForm({ rating: 5, comment: "" }); }} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                          <Star className="h-4 w-4" /> Leave a review
                        </button>
                      )}
                    </div>
                  )}
                  {o.picker_status === "delivered" && o.buyer_rated && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Review submitted</p>
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