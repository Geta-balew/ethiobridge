import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Image as Img } from "@/components/ui/image";
import { Plane, Phone, Mail, Loader2, Calendar, MapPin, Ticket, X } from "lucide-react";

const DESTINATIONS = [
  { key: "Dubai", emoji: "🇦🇪", desc: "Direct flights from Addis Ababa" },
  { key: "Turkey", emoji: "🇹🇷", desc: "Istanbul connections" },
  { key: "Thailand", emoji: "🇹🇭", desc: "Bangkok routes" },
  { key: "China", emoji: "🇨🇳", desc: "Guangzhou & Beijing" },
];

export default function Tickets() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [bookingFlight, setBookingFlight] = useState(null);

  useEffect(() => {
    base44.entities.FlightTicket.list("-departure_date", 50)
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  const shown = filter === "All" ? tickets : tickets.filter((t) => t.destination === filter);

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Plane className="h-4 w-4" /> Back to marketplace
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Flight Tickets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Purchase flight tickets from Addis Ababa to Dubai, Turkey, Thailand, and China. Contact the agent or request a booking below.
          </p>
        </div>

        {/* Destination filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Chip active={filter === "All"} onClick={() => setFilter("All")}>All destinations</Chip>
          {DESTINATIONS.map((d) => (
            <Chip key={d.key} active={filter === d.key} onClick={() => setFilter(d.key)}>
              {d.emoji} {d.key}
            </Chip>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No flights available right now. Check back soon or contact us.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((t) => (
              <FlightCard key={t.id} ticket={t} onBook={() => setBookingFlight(t)} />
            ))}
          </div>
        )}
      </div>

      {bookingFlight && (
        <BookingModal flight={bookingFlight} onClose={() => setBookingFlight(null)} onDone={() => { setBookingFlight(null); toast({ title: "Booking requested!", description: "We'll contact you to confirm your seat." }); }} />
      )}
    </div>
  );
}

function FlightCard({ ticket, onBook }) {
  const statusStyles = {
    available: "bg-emerald-100 text-emerald-700",
    limited: "bg-amber-100 text-amber-700",
    sold_out: "bg-rose-100 text-rose-700",
  };
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative h-36 bg-gradient-to-br from-sky-100 to-indigo-100">
        {ticket.image ? (
          <Img src={ticket.image} alt="" className="h-full w-full object-cover" fittingType="fill" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Plane className="h-10 w-10 text-sky-500/60" />
          </div>
        )}
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[ticket.status] || statusStyles.available}`}>
          {ticket.status === "sold_out" ? "Sold out" : ticket.status === "limited" ? "Limited seats" : "Available"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {ticket.departure_city || "Addis Ababa"} → {ticket.destination}
        </div>
        <h3 className="mt-1 text-base font-semibold">{ticket.airline}</h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {ticket.departure_date}</span>
          {ticket.return_date && <span>↩ {ticket.return_date}</span>}
        </div>
        <p className="mt-3 text-lg font-bold text-foreground">{ticket.price?.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ETB</span></p>

        <div className="mt-3 space-y-1.5 rounded-lg bg-muted/50 p-3 text-xs">
          <p className="font-medium text-muted-foreground">Contact to purchase:</p>
          <a href={`tel:${ticket.contact_phone}`} className="flex items-center gap-1.5 text-foreground hover:text-primary">
            <Phone className="h-3.5 w-3.5" /> {ticket.contact_phone}
          </a>
          {ticket.contact_email && (
            <a href={`mailto:${ticket.contact_email}`} className="flex items-center gap-1.5 text-foreground hover:text-primary">
              <Mail className="h-3.5 w-3.5" /> {ticket.contact_email}
            </a>
          )}
        </div>

        <button
          onClick={onBook}
          disabled={ticket.status === "sold_out"}
          className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {ticket.status === "sold_out" ? "Sold out" : "Request booking"}
        </button>
      </div>
    </div>
  );
}

function BookingModal({ flight, onClose, onDone }) {
  const [form, setForm] = useState({ buyer_name: "", buyer_phone: "", buyer_email: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.buyer_name.trim() || !form.buyer_phone.trim()) return;
    setSaving(true);
    try {
      await base44.entities.TicketBooking.create({
        flight_ticket_id: flight.id,
        destination: flight.destination,
        airline: flight.airline,
        departure_date: flight.departure_date,
        price: flight.price,
        buyer_name: form.buyer_name,
        buyer_phone: form.buyer_phone,
        buyer_email: form.buyer_email,
        status: "pending",
      });
      onDone();
    } catch (e) {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-card p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Request booking</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{flight.airline} · {flight.departure_city || "Addis Ababa"} → {flight.destination} · {flight.departure_date}</p>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Full name *</span>
            <input className={inp} value={form.buyer_name} onChange={(e) => set("buyer_name", e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Phone *</span>
            <input className={inp} value={form.buyer_phone} onChange={(e) => set("buyer_phone", e.target.value)} placeholder="+251…" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</span>
            <input className={inp} value={form.buyer_email} onChange={(e) => set("buyer_email", e.target.value)} />
          </label>
        </div>
        <button onClick={submit} disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Request booking"}
        </button>
      </div>
    </div>
  );
}

const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring";

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}