import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Plane, Loader2, FileText, Clock, CheckCircle2, XCircle } from "lucide-react";

const COUNTRIES = ["Dubai", "China", "Other"];

export default function Visa() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    country: "Dubai",
    destination_country: "",
    full_name: "",
    phone: "",
    email: "",
    passport_number: "",
    travel_date: "",
    duration_days: 7,
    purpose: "",
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const loadRequests = () => {
    base44.entities.VisaRequest.list("-created_date", 20)
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRequests(); }, []);

  const submit = async () => {
    if (!form.full_name || !form.phone || !form.passport_number || !form.travel_date) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.VisaRequest.create({
        ...form,
        status: "pending",
      });
      toast({ title: "Visa request submitted!", description: "We'll contact you with next steps." });
      setForm({ country: "Dubai", destination_country: "", full_name: "", phone: "", email: "", passport_number: "", travel_date: "", duration_days: 7, purpose: "" });
      loadRequests();
    } catch (e) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Plane className="h-4 w-4" /> Back to marketplace
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Visa Services</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Request a visa for Dubai, China, or other accessible countries. Our team will guide you through the process.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Form */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-semibold">New visa request</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FL label="Destination country" required>
                <select className={inp} value={form.country} onChange={(e) => set("country", e.target.value)}>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FL>
              {form.country === "Other" && (
                <FL label="Specify country" required>
                  <input className={inp} value={form.destination_country} onChange={(e) => set("destination_country", e.target.value)} placeholder="e.g. Schengen, UK…" />
                </FL>
              )}
              <FL label="Full name" required>
                <input className={inp} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              </FL>
              <FL label="Phone" required>
                <input className={inp} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+251…" />
              </FL>
              <FL label="Email">
                <input className={inp} value={form.email} onChange={(e) => set("email", e.target.value)} />
              </FL>
              <FL label="Passport number" required>
                <input className={inp} value={form.passport_number} onChange={(e) => set("passport_number", e.target.value)} />
              </FL>
              <FL label="Intended travel date" required>
                <input type="date" className={inp} value={form.travel_date} onChange={(e) => set("travel_date", e.target.value)} />
              </FL>
              <FL label="Duration (days)">
                <input type="number" min="1" className={inp} value={form.duration_days} onChange={(e) => set("duration_days", Number(e.target.value))} />
              </FL>
              <FL label="Purpose of travel" full>
                <input className={inp} value={form.purpose} onChange={(e) => set("purpose", e.target.value)} placeholder="Tourism, business, family visit…" />
              </FL>
            </div>
            <button onClick={submit} disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit visa request"}
            </button>
          </div>

          {/* My requests */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold">My visa requests</h2>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : requests.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{r.country === "Other" ? r.destination_country || "Other" : r.country}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {r.travel_date} · {r.duration_days} days
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring";
function FL({ label, required, children, full }) {
  return <label className={`block ${full ? "sm:col-span-2" : ""}`}><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function StatusBadge({ status }) {
  const map = {
    pending: { icon: Clock, cls: "bg-amber-100 text-amber-700" },
    approved: { icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-700" },
    rejected: { icon: XCircle, cls: "bg-rose-100 text-rose-700" },
  };
  const { icon: Icon, cls } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}