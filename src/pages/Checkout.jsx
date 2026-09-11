import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCart } from "@/context/CartContext";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, MapPin, CreditCard, ShieldCheck, Trash2, KeyRound } from "lucide-react";

const REGIONS = [
  "Addis Ababa", "Amhara", "Oromia", "Tigray", "SNNPR", "Somali", "Afar",
  "Benishangul-Gumuz", "Gambela", "Harari", "Dire Dawa",
];

const genCode = () => String(Math.floor(1000 + Math.random() * 9000));

export default function Checkout() {
  const { items, subtotal, updateQty, removeItem, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    buyer_name: "",
    buyer_phone: "",
    buyer_alt_phone: "",
    buyer_email: "",
    delivery_address: "",
    delivery_city: "",
    delivery_region: "Addis Ababa",
    payment_method: "chapa",
  });
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = subtotal > 0 ? 150 : 0;
  const pickerFee = subtotal > 0 ? Math.max(500, Math.round(subtotal * 0.1)) : 0;
  const total = subtotal + deliveryFee + pickerFee;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (items.length === 0) return "Your cart is empty.";
    if (!form.buyer_name.trim()) return "Please enter your full name.";
    if (!form.buyer_phone.trim()) return "Please enter your phone number.";
    if (!form.delivery_address.trim()) return "Please enter your delivery address.";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Missing information", description: err, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const deliveryCode = genCode();
      const order = await base44.entities.Order.create({
        items: items.map((i) => ({
          item_id: i.item_id,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        subtotal,
        delivery_fee: deliveryFee,
        picker_fee: pickerFee,
        total,
        buyer_name: form.buyer_name,
        buyer_phone: form.buyer_phone,
        buyer_alt_phone: form.buyer_alt_phone,
        buyer_email: form.buyer_email,
        delivery_address: form.delivery_address,
        delivery_city: form.delivery_city,
        delivery_region: form.delivery_region,
        payment_method: form.payment_method,
        payment_status: form.payment_method === "manual" ? "manual_pending" : "pending",
        delivery_code: deliveryCode,
        status: "placed",
      });

      if (form.payment_method === "manual") {
        clearCart();
        navigate(`/checkout?status=manual&order=${order.id}`);
        return;
      }

      const returnUrl = `${window.location.origin}/checkout?status=chapa_return&order=${order.id}`;
      const res = await base44.functions.invoke("initializeChapaPayment", {
        order_id: order.id,
        amount: total,
        buyer_email: form.buyer_email,
        buyer_name: form.buyer_name,
        return_url: returnUrl,
      });
      const data = res.data || res;
      if (data.checkout_url) {
        clearCart();
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || "Could not start Chapa payment. Try manual payment.");
      }
    } catch (e) {
      toast({ title: "Checkout failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const returnStatus = urlParams.get("status");
  const returnOrder = urlParams.get("order");

  if (returnStatus) {
    return <OrderConfirmation status={returnStatus} orderId={returnOrder} />;
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-medium">Your cart is empty</p>
        <p className="text-sm text-muted-foreground">Browse the marketplace and add items to your cart.</p>
        <Link to="/" className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">Go shopping</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Continue shopping
        </Link>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Cart review */}
            <Card>
              <CardTitle>Order summary</CardTitle>
              <div className="space-y-3">
                {items.map((i) => (
                  <div key={i.item_id} className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {i.image && <Image src={i.image} alt="" className="h-full w-full object-cover" fittingType="fill" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{i.title}</p>
                      <p className="text-xs text-muted-foreground">{i.price.toLocaleString()} ETB</p>
                    </div>
                    <div className="flex items-center rounded-full border border-border">
                      <button onClick={() => updateQty(i.item_id, i.quantity - 1)} className="flex h-7 w-7 items-center justify-center text-sm hover:bg-muted">−</button>
                      <span className="w-7 text-center text-sm">{i.quantity}</span>
                      <button onClick={() => updateQty(i.item_id, i.quantity + 1)} className="flex h-7 w-7 items-center justify-center text-sm hover:bg-muted">+</button>
                    </div>
                    <button onClick={() => removeItem(i.item_id)} className="text-muted-foreground hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Delivery details */}
            <Card>
              <CardTitle icon={<MapPin className="h-4 w-4 text-emerald-600" />}>Delivery details</CardTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <input className={inputCls} value={form.buyer_name} onChange={(e) => set("buyer_name", e.target.value)} />
                </Field>
                <Field label="Phone number" required>
                  <input className={inputCls} value={form.buyer_phone} onChange={(e) => set("buyer_phone", e.target.value)} placeholder="+251…" />
                </Field>
                <Field label="Alternative phone (optional)">
                  <input className={inputCls} value={form.buyer_alt_phone} onChange={(e) => set("buyer_alt_phone", e.target.value)} placeholder="+251…" />
                </Field>
                <Field label="Email (optional)">
                  <input className={inputCls} value={form.buyer_email} onChange={(e) => set("buyer_email", e.target.value)} />
                </Field>
                <Field label="Delivery address" required className="sm:col-span-2">
                  <input className={inputCls} value={form.delivery_address} onChange={(e) => set("delivery_address", e.target.value)} placeholder="Street, house, landmark" />
                </Field>
                <Field label="City">
                  <input className={inputCls} value={form.delivery_city} onChange={(e) => set("delivery_city", e.target.value)} placeholder="e.g. Addis Ababa" />
                </Field>
                <Field label="Region">
                  <select className={inputCls} value={form.delivery_region} onChange={(e) => set("delivery_region", e.target.value)}>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
            </Card>

            {/* Payment */}
            <Card>
              <CardTitle icon={<CreditCard className="h-4 w-4" />}>Payment method</CardTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <PaymentOption active={form.payment_method === "chapa"} onClick={() => set("payment_method", "chapa")} title="Chapa" desc="Pay online with Chapa (CBE, Telebirr, cards)" />
                <PaymentOption active={form.payment_method === "manual"} onClick={() => set("payment_method", "manual")} title="Manual payment" desc="Bank transfer / cash — we confirm manually" />
              </div>
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card>
              <CardTitle>Summary</CardTitle>
              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={`${subtotal.toLocaleString()} ETB`} />
                <Row label="Delivery fee" value={`${deliveryFee.toLocaleString()} ETB`} />
                <Row label="Picker service fee" value={`${pickerFee.toLocaleString()} ETB`} />
                <div className="my-2 border-t border-border" />
                <Row label="Total" value={`${total.toLocaleString()} ETB`} bold />
              </div>
              <button onClick={submit} disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</> : form.payment_method === "chapa" ? "Pay with Chapa" : "Place order"}
              </button>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Your details are kept private and used only for delivery.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderConfirmation({ status, orderId }) {
  const [order, setOrder] = useState(null);
  useEffect(() => {
    if (orderId) base44.entities.Order.get(orderId).then(setOrder).catch(() => setOrder(null));
  }, [orderId]);

  const isPaid = status === "chapa_return";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isPaid ? "bg-emerald-100" : "bg-amber-100"}`}>
        <ShieldCheck className={`h-8 w-8 ${isPaid ? "text-emerald-600" : "text-amber-600"}`} />
      </div>
      <h1 className="mt-5 text-2xl font-semibold">{isPaid ? "Payment submitted!" : "Order placed!"}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {isPaid ? "We're confirming your Chapa payment. You'll be notified once it's verified." : "Your manual payment is pending confirmation. We'll reach out shortly."}
      </p>
      {order?.delivery_code && (
        <div className="mt-5 flex flex-col items-center rounded-xl bg-amber-50 border border-amber-200 px-8 py-4">
          <span className="flex items-center gap-1.5 text-xs text-amber-800"><KeyRound className="h-3.5 w-3.5" /> Your delivery code</span>
          <span className="mt-1 text-3xl font-bold tracking-[0.3em] text-amber-700">{order.delivery_code}</span>
          <span className="mt-1 text-xs text-amber-700">Give this code to your picker when you receive your item</span>
        </div>
      )}
      {orderId && <p className="mt-3 text-xs text-muted-foreground">Order ref: {orderId.slice(-8).toUpperCase()}</p>}
      <div className="mt-6 flex gap-3">
        <Link to="/orders" className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">Track my order</Link>
        <Link to="/" className="rounded-full border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted">Back to marketplace</Link>
      </div>
    </div>
  );
}

const inputCls = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring";

function Card({ children }) { return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">{children}</div>; }
function CardTitle({ children, icon }) { return <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">{icon}{children}</h2>; }
function Field({ label, required, children, className }) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}{required && <span className="text-rose-500"> *</span>}</span>
      {children}
    </label>
  );
}
function PaymentOption({ active, onClick, title, desc }) {
  return (
    <button onClick={onClick} className={`rounded-xl border p-4 text-left transition ${active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted"}`}>
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>
    </button>
  );
}
function Row({ label, value, bold }) {
  return <div className="flex justify-between"><span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span><span className={bold ? "font-semibold" : ""}>{value}</span></div>;
}