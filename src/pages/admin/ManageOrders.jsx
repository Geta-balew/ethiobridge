import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image as Img } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

const PAYMENT_BADGE = {
  paid: "bg-emerald-100 text-emerald-700",
  manual_confirmed: "bg-emerald-100 text-emerald-700",
  manual_pending: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-rose-100 text-rose-700",
};
const PICKER_BADGE = {
  unassigned: "bg-muted text-muted-foreground",
  claimed: "bg-blue-100 text-blue-700",
  picked: "bg-indigo-100 text-indigo-700",
  in_transit: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function ManageOrders() {
  const [orders, setOrders] = useState(null);
  const [open, setOpen] = useState(null);
  const { toast } = useToast();

  const load = async () => setOrders(await base44.entities.Order.list("-created_date", 100));
  useEffect(() => { load().catch(() => setOrders([])); }, []);

  const confirmManual = async (o) => {
    await base44.entities.Order.update(o.id, { payment_status: "manual_confirmed" });
    toast({ title: "Manual payment confirmed" });
    await load();
  };

  if (orders === null) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Orders</h1>
      <div className="grid gap-3">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border border-border bg-card">
            <button onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full items-center gap-3 p-4 text-left">
              <div className="flex-1">
                <p className="font-medium">{o.buyer_name} · {o.items?.length || 0} item(s)</p>
                <p className="text-sm text-muted-foreground">{Number(o.total).toLocaleString()} ETB · {o.delivery_city}, {o.delivery_region}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PAYMENT_BADGE[o.payment_status] || ""}`}>{o.payment_status}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PICKER_BADGE[o.picker_status] || ""}`}>{o.picker_status}</span>
              {open === o.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {open === o.id && (
              <div className="border-t border-border p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</h4>
                    {o.items?.map((it, i) => (
                      <div key={i} className="flex items-center gap-2 py-1 text-sm">
                        {it.image && <div className="h-9 w-9 overflow-hidden rounded border border-border"><Img src={it.image} alt="" className="h-full w-full object-cover" fittingType="fill" /></div>}
                        <span className="flex-1">{it.title} × {it.quantity}</span>
                        <span>{Number(it.price).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="mt-2 space-y-0.5 text-sm">
                      <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{Number(o.subtotal).toLocaleString()}</span></div>
                      <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{Number(o.delivery_fee).toLocaleString()}</span></div>
                      <div className="flex justify-between text-muted-foreground"><span>Picker fee</span><span>{Number(o.picker_fee).toLocaleString()}</span></div>
                      <div className="flex justify-between font-semibold"><span>Total</span><span>{Number(o.total).toLocaleString()} ETB</span></div>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Buyer & delivery</h4>
                    <p><span className="text-muted-foreground">Phone:</span> {o.buyer_phone}</p>
                    <p><span className="text-muted-foreground">Email:</span> {o.buyer_email || "—"}</p>
                    <p><span className="text-muted-foreground">Passport:</span> {o.passport_number}</p>
                    <p><span className="text-muted-foreground">Ticket:</span> {o.ticket_number}</p>
                    <p><span className="text-muted-foreground">Flight:</span> {o.flight_from} → {o.flight_to} on {o.flight_date}</p>
                    <p><span className="text-muted-foreground">Address:</span> {o.delivery_address}, {o.delivery_city}, {o.delivery_region}</p>
                    <p><span className="text-muted-foreground">Payment:</span> {o.payment_method} ({o.payment_status})</p>
                    {o.passport_image && <a href={o.passport_image} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View passport</a>}
                    {o.ticket_image && <span className="ml-3"><a href={o.ticket_image} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View ticket</a></span>}
                    {o.payment_status === "manual_pending" && (
                      <button onClick={() => confirmManual(o)} className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Confirm manual payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {orders.length === 0 && <p className="py-12 text-center text-muted-foreground">No orders yet.</p>}
      </div>
    </div>
  );
}