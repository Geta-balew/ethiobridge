import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, X, Loader2, Plane } from "lucide-react";

const DESTINATIONS = ["Dubai", "Turkey", "Thailand", "China"];
const STATUSES = ["available", "limited", "sold_out"];
const empty = {
  destination: "Dubai", departure_city: "Addis Ababa", airline: "", departure_date: "",
  return_date: "", price: "", contact_phone: "", contact_email: "", seats_available: 1,
  status: "available", image: "",
};

export default function ManageTickets() {
  const [tickets, setTickets] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => setTickets(await base44.entities.FlightTicket.list("-departure_date", 100));
  useEffect(() => { load().catch(() => setTickets([])); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setEditing("new"); setForm(empty); };
  const openEdit = (t) => {
    setEditing(t.id);
    setForm({ ...empty, ...t, price: t.price ?? "", seats_available: t.seats_available ?? 1 });
  };

  const save = async () => {
    if (!form.airline || !form.price || !form.departure_date || !form.contact_phone) {
      toast({ title: "Airline, price, date and contact phone are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        seats_available: Number(form.seats_available) || 0,
      };
      if (editing === "new") await base44.entities.FlightTicket.create(payload);
      else await base44.entities.FlightTicket.update(editing, payload);
      toast({ title: "Flight saved" });
      setEditing(null);
      await load();
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t) => {
    if (!confirm(`Delete ${t.airline} → ${t.destination}?`)) return;
    await base44.entities.FlightTicket.delete(t.id);
    await load();
  };

  const statusCls = {
    available: "bg-emerald-100 text-emerald-700",
    limited: "bg-amber-100 text-amber-700",
    sold_out: "bg-rose-100 text-rose-700",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Flight Tickets</h1>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> Add flight
        </button>
      </div>

      {tickets === null ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-3">
          {tickets.map((t) => (
            <div key={t.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sky-100">
                <Plane className="h-5 w-5 text-sky-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.airline} · {t.departure_city} → {t.destination}</p>
                <p className="text-sm text-muted-foreground">
                  {t.departure_date} · {Number(t.price).toLocaleString()} ETB · {t.seats_available} seats
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusCls[t.status]}`}>{t.status}</span>
              <button onClick={() => openEdit(t)} className="rounded-full p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(t)} className="rounded-full p-2 text-rose-500 hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {tickets.length === 0 && <p className="py-12 text-center text-muted-foreground">No flights yet. Add your first flight.</p>}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setEditing(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing === "new" ? "Add flight" : "Edit flight"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <L label="Destination">
                  <select className={inp} value={form.destination} onChange={(e) => set("destination", e.target.value)}>
                    {DESTINATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </L>
                <L label="Departure city"><input className={inp} value={form.departure_city} onChange={(e) => set("departure_city", e.target.value)} /></L>
              </div>
              <L label="Airline"><input className={inp} value={form.airline} onChange={(e) => set("airline", e.target.value)} /></L>
              <div className="grid grid-cols-2 gap-3">
                <L label="Departure date"><input type="date" className={inp} value={form.departure_date} onChange={(e) => set("departure_date", e.target.value)} /></L>
                <L label="Return date"><input type="date" className={inp} value={form.return_date} onChange={(e) => set("return_date", e.target.value)} /></L>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <L label="Price (ETB)"><input type="number" className={inp} value={form.price} onChange={(e) => set("price", e.target.value)} /></L>
                <L label="Seats available"><input type="number" className={inp} value={form.seats_available} onChange={(e) => set("seats_available", e.target.value)} /></L>
              </div>
              <L label="Contact phone"><input className={inp} value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} placeholder="+251…" /></L>
              <L label="Contact email"><input className={inp} value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} /></L>
              <L label="Status">
                <select className={inp} value={form.status} onChange={(e) => set("status", e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </L>
              <L label="Image URL (optional)"><input className={inp} value={form.image} onChange={(e) => set("image", e.target.value)} /></L>
              <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save flight"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring";
function L({ label, children }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}