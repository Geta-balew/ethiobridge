import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle, Clock, Phone, Mail, FileText } from "lucide-react";

export default function ManageVisaRequests() {
  const [requests, setRequests] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const { toast } = useToast();

  const load = async () => setRequests(await base44.entities.VisaRequest.list("-created_date", 100));
  useEffect(() => { load().catch(() => setRequests([])); }, []);

  const approve = async (r) => {
    setUpdating(r.id);
    try {
      await base44.entities.VisaRequest.update(r.id, { status: "approved" });
      toast({ title: "Visa request approved" });
      await load();
    } catch (e) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const reject = async (r) => {
    setUpdating(r.id);
    try {
      await base44.entities.VisaRequest.update(r.id, { status: "rejected", notes: rejectNote });
      setRejecting(null);
      setRejectNote("");
      toast({ title: "Visa request rejected" });
      await load();
    } catch (e) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const statusCls = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Visa Requests</h1>

      {requests === null ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : requests.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No visa requests yet.</p>
      ) : (
        <div className="grid gap-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium">{r.country === "Other" ? r.destination_country || "Other" : r.country}</span>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusCls[r.status]}`}>
                  {r.status === "pending" ? <Clock className="h-3 w-3" /> : r.status === "approved" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {r.status}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p><span className="text-muted-foreground">Name:</span> {r.full_name}</p>
                <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {r.phone}</p>
                {r.email && <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {r.email}</p>}
                <p><span className="text-muted-foreground">Passport:</span> {r.passport_number}</p>
                <p><span className="text-muted-foreground">Travel date:</span> {r.travel_date}</p>
                <p><span className="text-muted-foreground">Duration:</span> {r.duration_days} days</p>
                {r.purpose && <p className="sm:col-span-2"><span className="text-muted-foreground">Purpose:</span> {r.purpose}</p>}
                {r.notes && <p className="sm:col-span-2 text-rose-600"><span className="text-muted-foreground">Notes:</span> {r.notes}</p>}
              </div>
              {r.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => approve(r)}
                    disabled={updating === r.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => { setRejecting(r.id); setRejectNote(""); }}
                    disabled={updating === r.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-rose-600 hover:bg-muted disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
              {rejecting === r.id && (
                <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                  <textarea
                    className="h-20 w-full rounded-lg border border-input bg-background p-2 text-sm outline-none focus:border-ring"
                    placeholder="Reason for rejection (shown to applicant)…"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                  />
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => reject(r)} disabled={updating === r.id} className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                      {updating === r.id ? "Rejecting…" : "Confirm reject"}
                    </button>
                    <button onClick={() => setRejecting(null)} className="rounded-full border border-border px-4 py-1.5 text-sm hover:bg-muted">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}