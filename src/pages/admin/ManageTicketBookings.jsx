import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle, Phone, Mail, Plane, Calendar } from "lucide-react";

export default function ManageTicketBookings() {
  const [bookings, setBookings] = useState(null);
  const [updating, setUpdating] = useState(null);
  const { toast } = useToast();

  const load = async () => setBookings(await base44.entities.TicketBooking.list("-created_date", 100));
  useEffect(() => { load().catch(() => setBookings([])); }, []);

  const updateStatus = async (b, status) => {
    setUpdating(b.id);
    try {
      await base44.entities.TicketBooking.update(b.id, { status });
      toast({ title: `Booking ${status}` });
      await load();
    } catch (e) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const statusCls = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
  };
  const payCls = { pending: "bg-amber-100 text-amber-700", paid: "bg-emerald-100 text-emerald-700", failed: "bg-rose-100 text-rose-700" };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Ticket Bookings</h1>

      {bookings === null ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : bookings.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No booking requests yet.</p>
      ) : (
        <div className="grid gap-3">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-sky-600" />
                  <span className="font-medium">{b.airline} → {b.destination}</span>
                </div>
                <div className="flex gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusCls[b.status]}`}>{b.status}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${payCls[b.payment_status] || payCls.pending}`}>
                    {b.payment_method === "chapa" ? `Chapa ${b.payment_status}` : "Request"}
                  </span>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p><span className="text-muted-foreground">Name:</span> {b.buyer_name}</p>
                <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {b.buyer_phone}</p>
                {b.buyer_email && <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {b.buyer_email}</p>}
                <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {b.departure_date}</p>
                <p><span className="text-muted-foreground">Price:</span> {Number(b.price || 0).toLocaleString()} ETB</p>
              </div>
              {b.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => updateStatus(b, "confirmed")}
                    disabled={updating === b.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Confirm
                  </button>
                  <button
                    onClick={() => updateStatus(b, "cancelled")}
                    disabled={updating === b.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-rose-600 hover:bg-muted disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" /> Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}