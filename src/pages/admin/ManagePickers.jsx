import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image as Img } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Star, Plane, Package, Wallet, Calendar } from "lucide-react";

export default function ManagePickers() {
  const [pickers, setPickers] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    const [p, o] = await Promise.all([
      base44.entities.Picker.list("-created_date", 200),
      base44.entities.Order.list("-created_date", 200),
    ]);
    setPickers(p);
    setOrders(o);
  };
  useEffect(() => { load().catch(() => setPickers([])); }, []);

  const verify = async (p) => {
    await base44.entities.Picker.update(p.id, { verification_status: "verified", rejection_reason: null });
    toast({ title: "Picker verified" });
    await load();
  };
  const reject = async (p) => {
    const reason = prompt("Reason for rejection?");
    if (reason === null) return;
    await base44.entities.Picker.update(p.id, { verification_status: "rejected", rejection_reason: reason });
    toast({ title: "Picker rejected" });
    await load();
  };

  if (pickers === null) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const today = new Date().toISOString().slice(0, 10);
  const isUpcoming = (p) => (p.next_return_date && p.next_return_date >= today) || (p.flight_date && p.flight_date >= today);
  const isInTransit = (p) => orders.some((o) => o.picker_id === p.created_by_id && o.picker_status === "in_transit");
  const hasPickedUp = (p) => orders.some((o) => o.picker_id === p.created_by_id && o.picker_status === "picked");

  const filtered = pickers.filter((p) => {
    if (tab === "in_transit") return isInTransit(p);
    if (tab === "upcoming") return isUpcoming(p);
    if (tab === "picked_up") return hasPickedUp(p);
    return true;
  });

  const statusColor = {
    pending: "bg-amber-100 text-amber-700",
    verified: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  };
  const tabs = [
    { key: "all", label: "All" },
    { key: "in_transit", label: "In transit" },
    { key: "upcoming", label: "Upcoming flights" },
    { key: "picked_up", label: "Items picked up" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Pickers</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ${tab === t.key ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{p.full_name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColor[p.verification_status]}`}>{p.verification_status}</span>
                  {p.verification_status === "verified" && p.rating > 0 && <span className="flex items-center gap-1 text-xs text-amber-600"><Star className="h-3 w-3 fill-amber-500" /> {p.rating.toFixed(1)} ({p.reviews_count || 0})</span>}
                  {p.verification_status === "verified" && isUpcoming(p) && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Standby</span>}
                </div>
                <p className="text-sm text-muted-foreground">{p.phone} · {p.email || "no email"}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {p.flight_date && <span className="flex items-center gap-1"><Plane className="h-3 w-3" /> Flight {p.flight_date}</span>}
                  {p.next_return_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Return {p.next_return_date}</span>}
                  <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {p.total_deliveries || 0} deliveries</span>
                  <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> {(p.wallet_balance || 0).toLocaleString()} ETB</span>
                </div>
                {p.rejection_reason && <p className="mt-1 text-xs text-rose-500">Rejected: {p.rejection_reason}</p>}
              </div>
              {p.verification_status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => verify(p)} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"><CheckCircle2 className="h-3.5 w-3.5" /> Verify</button>
                  <button onClick={() => reject(p)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-rose-600"><XCircle className="h-3.5 w-3.5" /> Reject</button>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.passport_image && <Doc label="Passport" src={p.passport_image} />}
              {p.national_id_image && <Doc label="National ID" src={p.national_id_image} />}
              {p.dubai_residence_permit && <Doc label="Residence permit" src={p.dubai_residence_permit} />}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No pickers in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Doc({ label, src }) {
  return (
    <a href={src} target="_blank" rel="noreferrer" className="block">
      <div className="h-20 w-28 overflow-hidden rounded-lg border border-border">
        <Img src={src} alt={label} className="h-full w-full object-cover" fittingType="fill" />
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </a>
  );
}