import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image as Img } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plane, Package, Wallet, MapPin, ArrowRight, ShieldCheck, Clock, CheckCircle2, KeyRound, X, Upload, Banknote, Calendar } from "lucide-react";

export default function PickerDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [requesting, setRequesting] = useState(null);
  const [pickData, setPickData] = useState({ trips: "", ticket_number: "", airline: "", arrival_location: "", ticket_screenshot: "" });
  const [uploadingTicket, setUploadingTicket] = useState(false);
  const [codeInput, setCodeInput] = useState({});
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", bank_account: "" });
  const [withdrawSaving, setWithdrawSaving] = useState(false);
  const [savingReturn, setSavingReturn] = useState(false);
  const [returnDate, setReturnDate] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const reload = async (me) => {
    const res = await base44.functions.invoke("getAvailableOrders", {});
    setAvailable((res.data || res).orders || []);
    const [myOrders, profiles, wds] = await Promise.all([
      base44.entities.Order.filter({ picker_id: me.id }, "-created_date", 50),
      base44.entities.Picker.filter({ created_by_id: me.id }),
      base44.entities.WithdrawalRequest.list("-created_date", 20),
    ]);
    setMine(myOrders);
    setProfile(profiles[0] || null);
    setWithdrawals(wds);
    if (profiles[0]?.next_return_date) setReturnDate(profiles[0].next_return_date);
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const profiles = await base44.entities.Picker.filter({ created_by_id: me.id });
        setProfile(profiles[0] || null);
        if (profiles[0]?.next_return_date) setReturnDate(profiles[0].next_return_date);
        if (profiles[0]?.verification_status === "verified" || me?.role === "admin") {
          await reload(me);
        }
      } catch { } finally { setLoading(false); }
    })();
  }, []);

  const uploadTicket = async (file) => {
    setUploadingTicket(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPickData((d) => ({ ...d, ticket_screenshot: file_url }));
    } catch (e) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploadingTicket(false);
    }
  };

  const requestPick = async (orderId) => {
    if (!pickData.trips) { toast({ title: "Enter your past Dubai flight count", variant: "destructive" }); return; }
    if (!pickData.ticket_number || !pickData.airline || !pickData.arrival_location || !pickData.ticket_screenshot) {
      toast({ title: "Fill all pickup details (ticket number, airline, screenshot, arrival location)", variant: "destructive" }); return;
    }
    setActing(orderId);
    try {
      await base44.functions.invoke("requestPick", {
        order_id: orderId,
        trips: Number(pickData.trips) || 0,
        ticket_number: pickData.ticket_number,
        airline: pickData.airline,
        ticket_screenshot: pickData.ticket_screenshot,
        arrival_location: pickData.arrival_location,
      });
      toast({ title: "Pick request sent", description: "Waiting for admin approval." });
      setRequesting(null);
      setPickData({ trips: "", ticket_number: "", airline: "", arrival_location: "", ticket_screenshot: "" });
      await reload(user);
    } catch (e) {
      toast({ title: "Request failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const setStatus = async (orderId, status) => {
    setActing(orderId);
    try {
      await base44.functions.invoke("updateOrderStatus", { order_id: orderId, picker_status: status });
      toast({ title: `Marked ${status.replace("_", " ")}` });
      await reload(user);
    } catch (e) {
      toast({ title: "Update failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const confirmDelivery = async (orderId) => {
    const code = codeInput[orderId];
    if (!code) { toast({ title: "Enter the delivery code", variant: "destructive" }); return; }
    setActing(orderId);
    try {
      await base44.functions.invoke("confirmDelivery", { order_id: orderId, code });
      toast({ title: "Delivery confirmed!", description: "Earnings added to your wallet." });
      setCodeInput((c) => ({ ...c, [orderId]: "" }));
      await reload(user);
    } catch (e) {
      toast({ title: "Confirmation failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const requestWithdrawal = async () => {
    if (!withdrawForm.amount || Number(withdrawForm.amount) <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    if (!withdrawForm.bank_account.trim()) { toast({ title: "Enter your bank account details", variant: "destructive" }); return; }
    if (Number(withdrawForm.amount) > (profile?.wallet_balance || 0)) { toast({ title: "Amount exceeds wallet balance", variant: "destructive" }); return; }
    setWithdrawSaving(true);
    try {
      await base44.functions.invoke("requestWithdrawal", { amount: Number(withdrawForm.amount), bank_account: withdrawForm.bank_account });
      toast({ title: "Withdrawal requested", description: "Funds arrive in 2–5 hours after approval." });
      setWithdrawForm({ amount: "", bank_account: "" });
      setShowWithdraw(false);
      await reload(user);
    } catch (e) {
      toast({ title: "Failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setWithdrawSaving(false);
    }
  };

  const saveReturnDate = async () => {
    setSavingReturn(true);
    try {
      await base44.entities.Picker.update(profile.id, { next_return_date: returnDate || null });
      toast({ title: "Return date saved", description: "You've joined the standby list." });
      await reload(user);
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSavingReturn(false);
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
  const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring";

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

        {profile && status === "verified" && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat icon={CheckCircle2} label="Status" value="Active" color="text-emerald-600 bg-emerald-50" />
              <Stat icon={Package} label="Active deliveries" value={mine.filter((o) => !["delivered", "cancelled"].includes(o.picker_status)).length} color="text-blue-600 bg-blue-50" />
              <Stat icon={Wallet} label="Wallet balance" value={`${(profile.wallet_balance || 0).toLocaleString()} ETB`} color="text-amber-600 bg-amber-50" />
              <Stat icon={Wallet} label="Total earned" value={`${(profile.total_earnings || 0).toLocaleString()} ETB`} color="text-emerald-600 bg-emerald-50" />
            </div>

            {/* Wallet & withdrawals */}
            <section className="mb-8 rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Wallet className="h-5 w-5 text-amber-500" /> Wallet &amp; withdrawals</h2>
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Available balance</p>
                  <p className="text-2xl font-semibold">{(profile.wallet_balance || 0).toLocaleString()} ETB</p>
                </div>
                <button onClick={() => setShowWithdraw((s) => !s)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                  <Banknote className="h-4 w-4" /> Withdraw
                </button>
              </div>

              {showWithdraw && (
                <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
                  <p className="mb-3 text-sm font-medium">Enter your bank account details to request a payout</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Amount (ETB)</span>
                      <input type="number" className={inp} value={withdrawForm.amount} onChange={(e) => setWithdrawForm((f) => ({ ...f, amount: e.target.value }))} placeholder="e.g. 1000" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Bank account details</span>
                      <input className={inp} value={withdrawForm.bank_account} onChange={(e) => setWithdrawForm((f) => ({ ...f, bank_account: e.target.value }))} placeholder="Bank name, account number, account name" />
                    </label>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={requestWithdrawal} disabled={withdrawSaving} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                      {withdrawSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />} Request payout
                    </button>
                    <button onClick={() => setShowWithdraw(false)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"><X className="h-4 w-4" /> Cancel</button>
                  </div>
                </div>
              )}

              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 text-amber-500" /> Approved payouts are transferred to your bank within <strong>2–5 hours</strong>.</p>

              {withdrawals.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent withdrawal requests</p>
                  {withdrawals.map((w) => (
                    <div key={w.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
                      <span>{Number(w.amount).toLocaleString()} ETB · {new Date(w.created_date).toLocaleDateString()}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${w.status === "approved" ? "bg-emerald-100 text-emerald-700" : w.status === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                        {w.status === "approved" ? "Approved — paid out" : w.status === "rejected" ? "Rejected" : "Pending review"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Standby return date */}
            <section className="mb-8 rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Calendar className="h-5 w-5 text-blue-500" /> Standby list</h2>
              <p className="mb-3 text-sm text-muted-foreground">Enter your next Addis Ababa return date to join the standby list — admins can assign orders to pickers with upcoming flights.</p>
              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Next return date to Addis Ababa</span>
                  <input type="date" className={inp + " sm:w-56"} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                </label>
                <button onClick={saveReturnDate} disabled={savingReturn} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                  {savingReturn ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save &amp; join standby
                </button>
              </div>
            </section>

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
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {o.delivery_city || "—"}, {o.delivery_region || "—"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Your fee</p>
                          <p className="text-lg font-semibold text-emerald-600">+{(o.picker_fee || 0).toLocaleString()} ETB</p>
                        </div>
                      </div>

                      {requesting === o.id ? (
                        <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">How many flights have you done before to Dubai? *</label>
                          <select className={inp + " mb-3"} value={pickData.trips} onChange={(e) => setPickData((d) => ({ ...d, trips: e.target.value }))}>
                            <option value="">Select…</option>
                            {Array.from({ length: 21 }, (_, i) => <option key={i} value={String(i)}>{i}</option>)}
                          </select>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Ticket number *</span>
                              <input className={inp} value={pickData.ticket_number} onChange={(e) => setPickData((d) => ({ ...d, ticket_number: e.target.value }))} />
                            </label>
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Airline *</span>
                              <select className={inp} value={pickData.airline} onChange={(e) => setPickData((d) => ({ ...d, airline: e.target.value }))}>
                                <option value="">Select airline…</option>
                                <option value="Ethiopian Airlines">Ethiopian Airlines</option>
                                <option value="Fly Dubai">Fly Dubai</option>
                                <option value="Emirates">Emirates</option>
                                <option value="Other">Other</option>
                              </select>
                            </label>
                            <label className="block sm:col-span-2">
                              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Addis Ababa arrival location *</span>
                              <select className={inp} value={pickData.arrival_location} onChange={(e) => setPickData((d) => ({ ...d, arrival_location: e.target.value }))}>
                                <option value="">Select arrival location…</option>
                                <option value="Megenagna">Megenagna</option>
                                <option value="Summit">Summit</option>
                              </select>
                            </label>
                            <label className="block sm:col-span-2">
                              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Ticket screenshot *</span>
                              {pickData.ticket_screenshot ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-16 w-24 overflow-hidden rounded-lg border border-border"><Img src={pickData.ticket_screenshot} alt="" className="h-full w-full object-cover" fittingType="fill" /></div>
                                  <button onClick={() => setPickData((d) => ({ ...d, ticket_screenshot: "" }))} className="text-xs text-rose-500 underline">Remove</button>
                                </div>
                              ) : (
                                <label className="flex h-16 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-background hover:bg-muted">
                                  {uploadingTicket ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadTicket(e.target.files[0])} />
                                </label>
                              )}
                            </label>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button onClick={() => requestPick(o.id)} disabled={acting === o.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                              {acting === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Send pick request
                            </button>
                            <button onClick={() => { setRequesting(null); setPickData({ trips: "", ticket_number: "", airline: "", arrival_location: "", ticket_screenshot: "" }); }} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"><X className="h-4 w-4" /> Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setRequesting(o.id)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                          <Package className="h-4 w-4" /> Request to pick
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* My orders */}
            <section>
              <h2 className="mb-3 text-lg font-semibold">My deliveries</h2>
              {mine.length === 0 ? (
                <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">No deliveries yet. Request an order above.</p>
              ) : (
                <div className="grid gap-3">
                  {mine.map((o) => (
                    <div key={o.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium">{o.buyer_name} · {o.items?.length || 0} item(s)</p>
                          <p className="text-sm text-muted-foreground">{o.delivery_address}{o.delivery_city ? `, ${o.delivery_city}` : ""}</p>
                          <p className="text-sm text-muted-foreground">📞 {o.buyer_phone}{o.buyer_alt_phone ? ` / ${o.buyer_alt_phone}` : ""}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold capitalize">{o.picker_status?.replace("_", " ")}</span>
                            {o.pick_request_status === "requested" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Waiting for approval</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Fee</p>
                          <p className="font-semibold text-emerald-600">{(o.picker_fee || 0).toLocaleString()} ETB</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {o.picker_status === "claimed" && <Btn onClick={() => setStatus(o.id, "picked")} loading={acting === o.id}>Mark picked up</Btn>}
                        {o.picker_status === "picked" && <Btn onClick={() => setStatus(o.id, "in_transit")} loading={acting === o.id}>In transit</Btn>}
                        {o.picker_status === "in_transit" && (
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
                              <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                              <input type="text" inputMode="numeric" maxLength={4} placeholder="Delivery code" className="w-24 bg-transparent text-sm outline-none" value={codeInput[o.id] || ""} onChange={(e) => setCodeInput((c) => ({ ...c, [o.id]: e.target.value }))} />
                            </div>
                            <Btn onClick={() => confirmDelivery(o.id)} loading={acting === o.id}>Confirm delivery</Btn>
                          </div>
                        )}
                        {o.picker_status === "delivered" && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Delivered · paid to wallet</span>}
                        {o.picker_status !== "delivered" && o.picker_status !== "cancelled" && o.pick_request_status === "approved" && (
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