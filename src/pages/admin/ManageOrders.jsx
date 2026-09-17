import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image as Img } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ChevronDown, ChevronUp, CheckCircle2, XCircle, UserCog, Plane, MapPin, Ticket } from "lucide-react";

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
  const [pickers, setPickers] = useState([]);
  const [open, setOpen] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [assignPicker, setAssignPicker] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");
  const { toast } = useToast();

  const load = async () => {
    const [o, p] = await Promise.all([
      base44.entities.Order.list("-created_date", 100),
      base44.entities.Picker.filter({ verification_status: "verified" }, "-rating", 100),
    ]);
    setOrders(o);
    setPickers(p);
  };
  useEffect(() => { load().catch(() => setOrders([])); }, []);

  const confirmManual = async (o) => {
    await base44.entities.Order.update(o.id, { payment_status: "manual_confirmed" });
    toast({ title: "Manual payment confirmed" });
    await load();
  };

  const reviewPick = async (o, approved) => {
    setReviewing(o.id);
    try {
      await base44.functions.invoke("reviewPickRequest", { order_id: o.id, approved });
      toast({ title: approved ? "Pick request approved" : "Pick request rejected" });
      await load();
    } catch (e) {
      toast({ title: "Failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setReviewing(null);
    }
  };

  const assignManual = async (o) => {
    const pickerUserId = assignPicker[o.id];
    if (!pickerUserId) { toast({ title: "Select a picker first", variant: "destructive" }); return; }
    setAssigning(o.id);
    try {
      await base44.entities.Order.update(o.id, {
        picker_id: pickerUserId,
        requested_picker_id: pickerUserId,
        pick_request_status: "approved",
        picker_status: "claimed",
      });
      toast({ title: "Picker assigned manually" });
      setAssignPicker((s) => ({ ...s, [o.id]: "" }));
      await load();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setAssigning(null);
    }
  };

  const matchesFilter = (o) => {
    if (statusFilter === "All") return true;
    if (statusFilter === "New Orders") return o.status === "placed" && o.payment_status === "manual_pending";
    if (statusFilter === "Pickup Requested") return o.pick_request_status === "requested";
    if (statusFilter === "Delivered") return o.picker_status === "delivered";
    if (statusFilter === "Completed") return o.status === "delivered";
    return true;
  };
  const filteredOrders = (orders || []).filter(matchesFilter);

  if (orders === null) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Orders</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        {["All", "New Orders", "Pickup Requested", "Delivered", "Completed"].map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)} className={`rounded-full px-3.5 py-1.5 text-sm transition ${statusFilter === f ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>{f}</button>
        ))}
      </div>
      <div className="grid gap-3">
        {filteredOrders.map((o) => (
          <div key={o.id} className="rounded-xl border border-border bg-card">
            <button onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full items-center gap-3 p-4 text-left">
              <div className="flex-1">
                <p className="font-medium">{o.buyer_name} · {o.items?.length || 0} item(s)</p>
                <p className="text-sm text-muted-foreground">{Number(o.total).toLocaleString()} ETB · {o.delivery_city}, {o.delivery_region}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PAYMENT_BADGE[o.payment_status] || ""}`}>{o.payment_status}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PICKER_BADGE[o.picker_status] || ""}`}>{o.picker_status}</span>
              {o.pick_request_status === "requested" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">pick requested</span>}
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
                      {o.coupon_discount > 0 && <div className="flex justify-between text-rose-600"><span>Coupon ({o.coupon_code})</span><span>−{Number(o.coupon_discount).toLocaleString()}</span></div>}
                      <div className="flex justify-between font-semibold"><span>Total</span><span>{Number(o.total).toLocaleString()} ETB</span></div>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Buyer & delivery</h4>
                    <p><span className="text-muted-foreground">Phone:</span> {o.buyer_phone}{o.buyer_alt_phone ? ` / ${o.buyer_alt_phone}` : ""}</p>
                    {o.buyer_email && <p><span className="text-muted-foreground">Email:</span> {o.buyer_email}</p>}
                    <p><span className="text-muted-foreground">Address:</span> {o.delivery_address}{o.delivery_city ? `, ${o.delivery_city}` : ""}{o.delivery_region ? `, ${o.delivery_region}` : ""}</p>
                    <p><span className="text-muted-foreground">Payment:</span> {o.payment_method} ({o.payment_status})</p>
                    {o.payment_screenshot && (
                      <div className="mt-2">
                        <p className="mb-1 text-xs text-muted-foreground">Payment screenshot:</p>
                        <a href={o.payment_screenshot} target="_blank" rel="noreferrer"><div className="h-24 w-40 overflow-hidden rounded border border-border"><Img src={o.payment_screenshot} alt="payment" className="h-full w-full object-cover" fittingType="fill" /></div></a>
                      </div>
                    )}
                    {o.delivery_code && <p><span className="text-muted-foreground">Delivery code:</span> <span className="font-mono font-semibold tracking-widest">{o.delivery_code}</span></p>}
                    {o.payment_status === "manual_pending" && (
                      <button onClick={() => confirmManual(o)} className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Confirm manual payment
                      </button>
                    )}

                    {/* Picker pickup details */}
                    {(o.picker_ticket_number || o.picker_airline || o.picker_arrival_location) && (
                      <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-800"><Ticket className="h-3.5 w-3.5" /> Picker pickup details</p>
                        <p className="text-xs text-indigo-800">Ticket #: {o.picker_ticket_number || "—"}</p>
                        <p className="text-xs text-indigo-800">Airline: {o.picker_airline || "—"}</p>
                        <p className="flex items-center gap-1 text-xs text-indigo-800"><MapPin className="h-3 w-3" /> {o.picker_arrival_location || "—"}</p>
                        {o.picker_ticket_image && <a href={o.picker_ticket_image} target="_blank" rel="noreferrer" className="mt-1 inline-block"><div className="h-16 w-24 overflow-hidden rounded border border-indigo-200"><Img src={o.picker_ticket_image} alt="ticket" className="h-full w-full object-cover" fittingType="fill" /></div></a>}
                      </div>
                    )}

                    {o.pick_request_status === "requested" && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-medium text-amber-800">Pick request — picker reports {o.pick_request_trips || 0} prior Dubai trip(s)</p>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => reviewPick(o, true)} disabled={reviewing === o.id} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve picker
                          </button>
                          <button onClick={() => reviewPick(o, false)} disabled={reviewing === o.id} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-muted disabled:opacity-50">
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Manual picker assignment */}
                    {o.picker_status === "unassigned" && o.pick_request_status !== "requested" && (
                      <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold"><UserCog className="h-3.5 w-3.5" /> Manual picker assignment</p>
                        <select value={assignPicker[o.id] || ""} onChange={(e) => setAssignPicker((s) => ({ ...s, [o.id]: e.target.value }))} className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring">
                          <option value="">Select a verified picker…</option>
                          {pickers.map((p) => (
                            <option key={p.id} value={p.created_by_id}>
                              {p.full_name} {p.next_return_date ? `(return ${p.next_return_date})` : ""} — {p.rating?.toFixed(1) || "new"} ★
                            </option>
                          ))}
                        </select>
                        <button onClick={() => assignManual(o)} disabled={assigning === o.id} className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
                          {assigning === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Assign picker
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredOrders.length === 0 && <p className="py-12 text-center text-muted-foreground">No orders found.</p>}
      </div>
    </div>
  );
}