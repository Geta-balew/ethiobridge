import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image as Img } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plane, Package, Wallet, MapPin, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";

export default function PickerDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const profiles = await base44.entities.Picker.filter({});
        setProfile(profiles[0] || null);
        if (profiles[0]?.verification_status === "verified" || me?.role === "admin") {
          const res = await base44.functions.invoke("getAvailableOrders", {});
          setAvailable((res.data || res).orders || []);
          const myOrders = await base44.entities.Order.filter({ picker_id: me.id }, "-created_date", 50);
          setMine(myOrders);
        }
      } catch (e) {
        // not logged in
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const claim = async (orderId) => {
    setActing(orderId);
    try {
      await base44.functions.invoke("claimOrder", { order_id: orderId });
      toast({ title: "Order claimed!" });
      const res = await base44.functions.invoke("getAvailableOrders", {});
      setAvailable((res.data || res).orders || []);
      const me = user;
      const myOrders = await base44.entities.Order.filter({ picker_id: me.id }, "-created_date", 50);
      setMine(myOrders);
    } catch (e) {
      toast({ title: "Could not claim", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const setStatus = async (orderId, status) => {
    setActing(orderId);
    try {
      await base44.functions.invoke("updateOrderStatus", { order_id: orderId, picker_status: status });
      toast({ title: `Marked ${status.replace("_", " ")}` });
      const me = user;
      const myOrders = await base44.entities.Order.filter({ picker_id: me.id }, "-created_date", 50);
      setMine(myOrders);
    } catch (e) {
      toast({ title: "Update failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-lg font-semibold">Please log in</p>
        <Link to="/login" className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">Log in</Link>
      </div>
    );
  }

  const status = profile?.verification_status;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-semibold tracking-tight">Picker dashboard</h1>
          </div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Marketplace</Link>
        </div>

        {/* No profile */}
        {!profile && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-emerald-600" />
            <h2 className="mt-3 text-lg font-semibold">Become a picker</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Carry items from Dubai to Addis Ababa and earn a fee on every delivery. Submit your verification documents to get started.
            </p>
            <button onClick={() => navigate("/picker/register")} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
              Start application <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Pending / rejected */}
        {profile && status !== "verified" && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            {status === "pending" ? (
              <>
                <Clock className="mx-auto h-10 w-10 text-amber-500" />
                <h2 className="mt-3 text-lg font-semibold">Verification in progress</h2>
                <p className="mt-1 text-sm text-muted-foreground">Our team is reviewing your documents. You'll be able to pick orders once verified.</p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-rose-600">Application rejected</h2>
                <p className="mt-1 text-sm text-muted-foreground">{profile.rejection_reason || "Please contact support."}</p>
              </>
            )}
          </div>
        )}

        {/* Verified */}
        {profile && status === "verified" && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat icon={CheckCircle2} label="Verified picker" value="Active" color="text-emerald-600 bg-emerald-50" />
              <Stat icon={Package} label="Active deliveries" value={mine.filter((o) => o.picker_status !== "delivered" && o.picker_status !== "cancelled").length} color="text-blue-600 bg-blue-50" />
              <Stat icon={Wallet} label="Earned (delivered)" value={`${mine.filter((o) => o.picker_status === "delivered").reduce((s, o) => s + (o.picker_fee || 0), 0).toLocaleString()} ETB`} color="text-amber-600 bg-amber-50" />
            </div>

            {/* Available orders */}
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold">Available orders</h2>
              {available.length === 0 ? (
                <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">No orders waiting to be picked right now.</p>
              ) : (
                <div className="grid gap-3">
                  {available.map((o) => (
                    <div key={o.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium">{o.items?.length || 0} item(s) · {(o.subtotal || 0).toLocaleString()} ETB</p>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" /> {o.delivery_city}, {o.delivery_region}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">Flight: {o.flight_date || "—"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Your fee</p>
                          <p className="text-lg font-semibold text-emerald-600">+{(o.picker_fee || 0).toLocaleString()} ETB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => claim(o.id)}
                        disabled={acting === o.id}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                      >
                        {acting === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                        Claim & pick
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* My orders */}
            <section>
              <h2 className="mb-3 text-lg font-semibold">My deliveries</h2>
              {mine.length === 0 ? (
                <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">No deliveries yet. Claim an order above.</p>
              ) : (
                <div className="grid gap-3">
                  {mine.map((o) => (
                    <div key={o.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium">{o.buyer_name} · {o.items?.length || 0} item(s)</p>
                          <p className="text-sm text-muted-foreground">{o.delivery_address}, {o.delivery_city}, {o.delivery_region}</p>
                          <p className="text-sm text-muted-foreground">📞 {o.buyer_phone}</p>
                          <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold capitalize">{o.picker_status?.replace("_", " ")}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Fee</p>
                          <p className="font-semibold text-emerald-600">{(o.picker_fee || 0).toLocaleString()} ETB</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {o.picker_status === "claimed" && <Btn onClick={() => setStatus(o.id, "picked")} loading={acting === o.id}>Mark picked up</Btn>}
                        {o.picker_status === "picked" && <Btn onClick={() => setStatus(o.id, "in_transit")} loading={acting === o.id}>In transit</Btn>}
                        {o.picker_status === "in_transit" && <Btn onClick={() => setStatus(o.id, "delivered")} loading={acting === o.id}>Mark delivered</Btn>}
                        {o.picker_status !== "delivered" && o.picker_status !== "cancelled" && (
                          <button onClick={() => setStatus(o.id, "cancelled")} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-rose-600">Cancel</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon className="h-4 w-4" /></div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
function Btn({ children, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}