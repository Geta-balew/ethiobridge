import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle, Wallet } from "lucide-react";

export default function ManageWithdrawals() {
  const [items, setItems] = useState(null);
  const [acting, setActing] = useState(null);
  const { toast } = useToast();

  const load = async () => setItems(await base44.entities.WithdrawalRequest.list("-created_date", 100));
  useEffect(() => { load().catch(() => setItems([])); }, []);

  const review = async (w, approved) => {
    let note = "";
    if (!approved) note = prompt("Rejection reason?", "") || "";
    setActing(w.id);
    try {
      await base44.functions.invoke("reviewWithdrawal", { withdrawal_id: w.id, approved, admin_note: note });
      toast({ title: approved ? "Withdrawal approved — wallet debited" : "Withdrawal rejected" });
      await load();
    } catch (e) {
      toast({ title: "Failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  if (items === null) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const statusColor = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Withdrawal requests</h1>
      <div className="grid gap-3">
        {items.map((w) => (
          <div key={w.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{w.picker_name}</p>
                <p className="text-sm font-medium text-emerald-600">{Number(w.amount).toLocaleString()} ETB</p>
                <p className="mt-1 text-xs text-muted-foreground">Bank: {w.bank_account}</p>
                <p className="text-xs text-muted-foreground">{new Date(w.created_date).toLocaleDateString()}</p>
                {w.admin_note && <p className="mt-1 text-xs text-muted-foreground">Note: {w.admin_note}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusColor[w.status]}`}>{w.status}</span>
                {w.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => review(w, true)} disabled={acting === w.id} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                      {acting === w.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve
                    </button>
                    <button onClick={() => review(w, false)} disabled={acting === w.id} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-rose-600 disabled:opacity-50">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No withdrawal requests yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}