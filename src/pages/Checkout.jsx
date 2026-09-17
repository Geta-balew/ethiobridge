import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCart } from "@/context/CartContext";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, MapPin, ShieldCheck, Trash2, KeyRound, Upload, Building2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { deliveryFeeFor } from "@/utils/pricing";

const REGIONS = [
  "Addis Ababa", "Sidama", "Amhara", "Oromia", "Tigray", "SNNPR", "Somali", "Afar",
  "Benishangul-Gumuz", "Gambela", "Harari", "Dire Dawa",
];

const BANK_ACCOUNTS = [
  { name: "Commercial Bank of Ethiopia", account: "1000 2345 6789 012", holder: "EthioBridge Trading" },
  { name: "Bank of Abyssinia", account: "8795 4321 0099", holder: "EthioBridge Trading" },
  { name: "Telebirr", account: "0911 234 567", holder: "EthioBridge Trading" },
];

const genCode = () => String(Math.floor(1000 + Math.random() * 9000));

export default function Checkout() {
  const { items, subtotal, updateQty, removeItem, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    buyer_name: "", buyer_phone: "", buyer_alt_phone: "", buyer_email: "",
    delivery_address: "", delivery_city: "", delivery_region: "Addis Ababa",
  });
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [pickers, setPickers] = useState([]);
  const [preferredPicker, setPreferredPicker] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const deliveryFee = deliveryFeeFor(form.delivery_region, totalQty);
  const orderPickerFee = items.reduce((s, i) => s + (i.picker_fee || 0) * i.quantity, 0);
  const total = subtotal - couponDiscount + deliveryFee;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => { setCouponDiscount(0); setCouponApplied(null); setCouponMsg(""); }, [subtotal]);

  useEffect(() => {
    base44.entities.Picker.filter({ verification_status: "verified" }, "-rating", 50)
      .then(setPickers).catch(() => setPickers([]));
  }, []);

  const uploadScreenshot = async (file) => {
    setUploadingScreenshot(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setPaymentScreenshot(file_url);
    } catch (e) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true); setCouponMsg("");
    try {
      const res = await base44.functions.invoke("validateCoupon", { code: couponCode.trim() });
      const data = res.data || res;
      if (data.valid) {
        setCouponDiscount(Math.round((subtotal * data.discount_percent) / 100));
        setCouponApplied({ code: data.code, percent: data.discount_percent });
        setCouponMsg(`${data.discount_percent}% discount applied`);
      } else {
        setCouponDiscount(0); setCouponApplied(null);
        setCouponMsg(data.message || "Invalid coupon");
      }
    } catch (e) {
      setCouponDiscount(0); setCouponApplied(null);
      setCouponMsg(e.response?.data?.message || e.message || "Invalid coupon");
    } finally { setApplyingCoupon(false); }
  };

  const validate = () => {
    if (items.length === 0) return "Your cart is empty.";
    if (!form.buyer_name.trim()) return "Please enter your full name.";
    if (!form.buyer_phone.trim()) return "Please enter your phone number.";
    if (!form.delivery_address.trim()) return "Please enter your delivery address.";
    if (!paymentScreenshot) return "Please upload your payment screenshot.";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { toast({ title: "Missing information", description: err, variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const deliveryCode = genCode();
      const order = await base44.entities.Order.create({
        items: items.map((i) => ({ item_id: i.item_id, title: i.title, price: i.price, quantity: i.quantity, image: i.image })),
        subtotal, delivery_fee: deliveryFee, picker_fee: orderPickerFee,
        coupon_code: couponApplied?.code || "", coupon_discount: couponDiscount,
        total, buyer_name: form.buyer_name, buyer_phone: form.buyer_phone,
        buyer_alt_phone: form.buyer_alt_phone, buyer_email: form.buyer_email,
        delivery_address: form.delivery_address, delivery_city: form.delivery_city, delivery_region: form.delivery_region,
        payment_method: "manual", payment_status: "manual_pending",
        payment_screenshot: paymentScreenshot,
        preferred_picker_id: preferredPicker || null,
        delivery_code: deliveryCode, status: "placed",
      });
      clearCart();
      navigate(`/checkout?status=manual&order=${order.id}`);
    } catch (e) {
      toast({ title: "Checkout failed", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const returnStatus = urlParams.get("status");
  const returnOrder = urlParams.get("order");

  if (returnStatus) return <OrderConfirmation status={returnStatus} orderId={returnOrder} />;

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
                    {REGIONS.map((r) => <option key={r} value={r}>{r}{r === "Addis Ababa" ? " (free delivery)" : ""}</option>)}
                  </select>
                </Field>
                <Field label="Preferred picker (optional)" className="sm:col-span-2">
                  <select className={inputCls} value={preferredPicker} onChange={(e) => setPreferredPicker(e.target.value)}>
                    <option value="">No preference — assign automatically</option>
                    {pickers.map((p) => <option key={p.id} value={p.created_by_id}>{p.full_name} — {p.rating?.toFixed(1) || "new"} ★ ({p.total_deliveries || 0} deliveries)</option>)}
                  </select>
                </Field>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {form.delivery_region === "Addis Ababa"
                  ? "Free delivery within Addis Ababa."
                  : `Delivery fee to ${form.delivery_region}: ${deliveryFee.toLocaleString()} ETB.`}
              </p>
            </Card>

            {/* Manual payment */}
            <Card>
              <CardTitle icon={<Building2 className="h-4 w-4" />}>Manual payment</CardTitle>
              <p className="mb-3 text-sm text-muted-foreground">Transfer the total to one of the accounts below, then upload your payment screenshot. We'll confirm it manually.</p>
              <div className="space-y-2">
                {BANK_ACCOUNTS.map((b) => (
                  <div key={b.name} className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-sm font-semibold">{b.name}</p>
                    <p className="text-sm text-muted-foreground">Account: <span className="font-mono font-medium text-foreground">{b.account}</span></p>
                    <p className="text-xs text-muted-foreground">Holder: {b.holder}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Payment screenshot *</span>
                {paymentScreenshot ? (
                  <div className="flex items-center gap-3">
                    <div className="h-20 w-32 overflow-hidden rounded-lg border border-border"><Image src={paymentScreenshot} alt="payment" className="h-full w-full object-cover" fittingType="fill" /></div>
                    <button onClick={() => setPaymentScreenshot("")} className="text-xs text-rose-500 underline">Remove</button>
                  </div>
                ) : (
                  <label className="flex h-20 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted hover:bg-muted/70">
                    {uploadingScreenshot ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <><Upload className="h-5 w-5 text-muted-foreground" /> <span className="text-sm text-muted-foreground">Upload screenshot</span></>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadScreenshot(e.target.files[0])} />
                  </label>
                )}
              </div>
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card>
              <CardTitle>Summary</CardTitle>
              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={`${subtotal.toLocaleString()} ETB`} />
                {couponDiscount > 0 && <Row label={`Coupon (${couponApplied?.code})`} value={`−${couponDiscount.toLocaleString()} ETB`} />}
                <Row label="Delivery fee" value={deliveryFee === 0 ? "Free" : `${deliveryFee.toLocaleString()} ETB`} />
                <div className="my-2 border-t border-border" />
                <Row label="Total" value={`${total.toLocaleString()} ETB`} bold />
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Coupon code</label>
                <div className="flex gap-2">
                  <input className={inputCls} value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter code" />
                  <button onClick={applyCoupon} disabled={applyingCoupon} className="shrink-0 rounded-full border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50">
                    {applyingCoupon ? "…" : "Apply"}
                  </button>
                </div>
                {couponMsg && <p className={`mt-1.5 text-xs ${couponApplied ? "text-emerald-600" : "text-rose-500"}`}>{couponMsg}</p>}
              </div>

              <button onClick={submit} disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</> : "Place order"}
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

  const downloadOrder = () => {
    if (!order) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("EthioBridge — Order Receipt", 14, 20);
    doc.setFontSize(11);
    doc.text(`Order ref: ${orderId}`, 14, 32);
    doc.text(`Date: ${new Date(order.created_date).toLocaleString()}`, 14, 40);
    doc.text(`Delivery code: ${order.delivery_code || "—"}`, 14, 48);
    let y = 60;
    doc.setFontSize(12);
    doc.text("Items:", 14, y); y += 8;
    doc.setFontSize(10);
    (order.items || []).forEach((it) => {
      doc.text(`${it.title} x${it.quantity} — ${Number(it.price).toLocaleString()} ETB`, 18, y); y += 7;
    });
    y += 2;
    doc.setFontSize(11);
    doc.text(`Subtotal: ${Number(order.subtotal).toLocaleString()} ETB`, 14, y); y += 7;
    doc.text(`Delivery fee: ${Number(order.delivery_fee).toLocaleString()} ETB`, 14, y); y += 7;
    if (order.coupon_discount) { doc.text(`Coupon (${order.coupon_code}): -${Number(order.coupon_discount).toLocaleString()} ETB`, 14, y); y += 7; }
    doc.setFontSize(13);
    doc.text(`Total: ${Number(order.total).toLocaleString()} ETB`, 14, y); y += 10;
    doc.setFontSize(10);
    doc.text(`Buyer: ${order.buyer_name}`, 14, y); y += 6;
    doc.text(`Phone: ${order.buyer_phone}`, 14, y); y += 6;
    doc.text(`Address: ${order.delivery_address}, ${order.delivery_city || ""}, ${order.delivery_region || ""}`, 14, y); y += 6;
    doc.text(`Payment: manual (${order.payment_status})`, 14, y);
    doc.save(`ethiobridge-order-${String(orderId).slice(-8)}.pdf`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <ShieldCheck className="h-8 w-8 text-amber-600" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold">Order placed!</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Your payment screenshot has been received. We'll confirm it shortly and assign a picker.
      </p>
      {order?.delivery_code && (
        <div className="mt-5 flex flex-col items-center rounded-xl bg-amber-50 border border-amber-200 px-8 py-4">
          <span className="flex items-center gap-1.5 text-xs text-amber-800"><KeyRound className="h-3.5 w-3.5" /> Your delivery code</span>
          <span className="mt-1 text-3xl font-bold tracking-[0.3em] text-amber-700">{order.delivery_code}</span>
          <span className="mt-1 text-xs text-amber-700">Give this code to your picker when you receive your item</span>
        </div>
      )}
      {orderId && <p className="mt-3 text-xs text-muted-foreground">Order ref: {orderId.slice(-8).toUpperCase()}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/orders" className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">Track my order</Link>
        <button onClick={downloadOrder} disabled={!order} className="rounded-full border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50">Download order details</button>
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
function Row({ label, value, bold }) {
  return <div className="flex justify-between"><span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span><span className={bold ? "font-semibold" : ""}>{value}</span></div>;
}