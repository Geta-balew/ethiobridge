import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCart } from "@/context/CartContext";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, Upload, Plane, MapPin, CreditCard, ShieldCheck, Trash2 } from "lucide-react";

const REGIONS = [
  "Addis Ababa", "Amhara", "Oromia", "Tigray", "SNNPR", "Somali", "Afar",
  "Benishangul-Gumuz", "Gambela", "Harari", "Dire Dawa",
];

export default function Checkout() {
  const { items, subtotal, updateQty, removeItem, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    buyer_name: "",
    buyer_phone: "",
    buyer_email: "",
    passport_number: "",
    ticket_number: "",
    flight_date: "",
    delivery_address: "",
    delivery_city: "",
    delivery_region: "Addis Ababa",
    payment_method: "chapa",
  });
  const [passportImg, setPassportImg] = useState("");
  const [ticketImg, setTicketImg] = useState("");
  const [uploading, setUploading] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = subtotal > 0 ? 150 : 0;
  const pickerFee = subtotal > 0 ? Math.max(500, Math.round(subtotal * 0.1)) : 0;
  const total = subtotal + deliveryFee + pickerFee;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadFile = async (file, field) => {
    setUploading(field);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (field === "passport") setPassportImg(file_url);
      else setTicketImg(file_url);
      toast({ title: "Uploaded", description: field === "passport" ? "Passport image saved" : "Ticket image saved" });
    } catch (e) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const validate = () => {
    if (items.length === 0) return "Your cart is empty.";
    if (!form.buyer_name.trim()) return "Please enter your full name.";
    if (!form.buyer_phone.trim()) return "Please enter your phone number.";
    if (!form.passport_number.trim()) return "Please enter your passport number.";
    if (!passportImg) return "Please upload a photo of your passport.";
    if (!form.ticket_number.trim()) return "Please enter your ticket number.";
    if (!ticketImg) return "Please upload a photo of your ticket.";
    if (!form.flight_date) return "Please select your flight date.";
    if (!form.delivery_address.trim()) return "Please enter your delivery address.";
    if (!form.delivery_city.trim()) return "Please enter your delivery city.";
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
        buyer_email: form.buyer_email,
        passport_number: form.passport_number,
        passport_image: passportImg,
        ticket_number: form.ticket_number,
        ticket_image: ticketImg,
        flight_date: form.flight_date,
        flight_from: "Dubai",
        flight_to: "Addis Ababa",
        delivery_address: form.delivery_address,
        delivery_city: form.delivery_city,
        delivery_region: form.delivery_region,
        payment_method: form.payment_method,
        payment_status: form.payment_method === "manual" ? "manual_pending" : "pending",
        status: "placed",
      });

      if (form.payment_method === "manual") {
        clearCart();
        toast({
          title: "Order placed!",
          description: "We'll confirm your manual payment shortly.",
        });
        navigate(`/checkout?status=manual&order=${order.id}`);
        return;
      }

      // Chapa flow
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

  if (items.length === 0 && !window.location.search.includes("status=")) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-medium">Your cart is empty</p>
        <p className="text-sm text-muted-foreground">Browse the marketplace and add items to your cart.</p>
        <Link to="/" className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
          Go shopping
        </Link>
      </div>
    );
  }

  const urlParams = new URLSearchParams(window.location.search);
  const returnStatus = urlParams.get("status");
  const returnOrder = urlParams.get("order");

  if (returnStatus) {
    return (
      <OrderConfirmation status={returnStatus} orderId={returnOrder} />
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
          {/* Forms */}
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
                    <button onClick={() => removeItem(i.item_id)} className="text-muted-foreground hover:text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Verification */}
            <Card>
              <CardTitle icon={<Plane className="h-4 w-4 text-amber-500" />}>Traveler verification</CardTitle>
              <p className="mb-4 text-xs text-muted-foreground">Required to confirm your Dubai → Addis flight and identity.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <input className={inputCls} value={form.buyer_name} onChange={(e) => set("buyer_name", e.target.value)} />
                </Field>
                <Field label="Phone number" required>
                  <input className={inputCls} value={form.buyer_phone} onChange={(e) => set("buyer_phone", e.target.value)} placeholder="+251…" />
                </Field>
                <Field label="Email (optional)">
                  <input className={inputCls} value={form.buyer_email} onChange={(e) => set("buyer_email", e.target.value)} />
                </Field>
                <Field label="Passport number" required>
                  <input className={inputCls} value={form.passport_number} onChange={(e) => set("passport_number", e.target.value)} />
                </Field>
                <FileField label="Passport photo" required value={passportImg} uploading={uploading === "passport"} onChange={(f) => uploadFile(f, "passport")} />
                <Field label="Ticket number" required>
                  <input className={inputCls} value={form.ticket_number} onChange={(e) => set("ticket_number", e.target.value)} />
                </Field>
                <FileField label="Ticket photo" required value={ticketImg} uploading={uploading === "ticket"} onChange={(f) => uploadFile(f, "ticket")} />
                <Field label="Flight date (Dubai → Addis)" required>
                  <input type="date" className={inputCls} value={form.flight_date} onChange={(e) => set("flight_date", e.target.value)} />
                </Field>
              </div>
            </Card>

            {/* Delivery */}
            <Card>
              <CardTitle icon={<MapPin className="h-4 w-4 text-emerald-600" />}>Delivery address in Ethiopia</CardTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Street / house address" required className="sm:col-span-2">
                  <input className={inputCls} value={form.delivery_address} onChange={(e) => set("delivery_address", e.target.value)} />
                </Field>
                <Field label="City" required>
                  <input className={inputCls} value={form.delivery_city} onChange={(e) => set("delivery_city", e.target.value)} placeholder="e.g. Addis Ababa" />
                </Field>
                <Field label="Region / rural area" required>
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
                <PaymentOption
                  active={form.payment_method === "chapa"}
                  onClick={() => set("payment_method", "chapa")}
                  title="Chapa"
                  desc="Pay online with Chapa (CBE, Telebirr, cards)"
                />
                <PaymentOption
                  active={form.payment_method === "manual"}
                  onClick={() => set("payment_method", "manual")}
                  title="Manual payment"
                  desc="Bank transfer / cash — we confirm manually"
                />
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
              <button
                onClick={submit}
                disabled={submitting}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</>
                ) : form.payment_method === "chapa" ? (
                  <>Pay with Chapa</>
                ) : (
                  <>Place order</>
                )}
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
  const isPaid = status === "chapa_return";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isPaid ? "bg-emerald-100" : "bg-amber-100"}`}>
        <ShieldCheck className={`h-8 w-8 ${isPaid ? "text-emerald-600" : "text-amber-600"}`} />
      </div>
      <h1 className="mt-5 text-2xl font-semibold">
        {isPaid ? "Payment submitted!" : "Order placed!"}
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {isPaid
          ? "We're confirming your Chapa payment. You'll be notified once it's verified."
          : "Your manual payment is pending confirmation. We'll reach out shortly."}
      </p>
      {orderId && <p className="mt-3 text-xs text-muted-foreground">Order reference: {orderId.slice(-8).toUpperCase()}</p>}
      <Link to="/" className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
        Back to marketplace
      </Link>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring";

function Card({ children }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">{children}</div>;
}
function CardTitle({ children, icon }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
      {icon}{children}
    </h2>
  );
}
function Field({ label, required, children, className }) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
function FileField({ label, required, value, uploading, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="h-14 w-20 overflow-hidden rounded-lg border border-border">
            <Image src={value} alt="" className="h-full w-full object-cover" fittingType="fill" />
          </div>
        ) : (
          <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <label className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
          {uploading ? "Uploading…" : value ? "Change" : "Upload"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && onChange(e.target.files[0])} />
        </label>
      </div>
    </label>
  );
}
function PaymentOption({ active, onClick, title, desc }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted"
      }`}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>
    </button>
  );
}
function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}