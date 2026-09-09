import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image as Img } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

export default function ManagePickers() {
  const [pickers, setPickers] = useState(null);
  const { toast } = useToast();

  const load = async () => setPickers(await base44.entities.Picker.list("-created_date", 100));
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

  const statusColor = {
    pending: "bg-amber-100 text-amber-700",
    verified: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Pickers</h1>
      <div className="grid gap-3">
        {pickers.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{p.full_name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColor[p.verification_status]}`}>{p.verification_status}</span>
                </div>
                <p className="text-sm text-muted-foreground">{p.phone} · {p.email || "no email"}</p>
                <p className="mt-1 text-xs text-muted-foreground">Passport: {p.passport_number} · National ID: {p.national_id_number}</p>
                {p.verification_status === "verified" && (
                  <p className="mt-1 text-xs text-emerald-600">Deliveries: {p.total_deliveries || 0}</p>
                )}
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
        {pickers.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No picker applications yet.</p>
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