import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Percent, Coins, Tag, Ticket, CheckSquare, Square, Trash2, Plus } from "lucide-react";

export default function PriceControls() {
  const [setting, setSetting] = useState(null);
  const [form, setForm] = useState({ exchange_rate: 52, global_discount_percent: 0 });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Per-item discount tool
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [itemDiscount, setItemDiscount] = useState("");
  const [applying, setApplying] = useState(false);

  // Coupons
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ code: "", discount_percent: "", expires_at: "", max_uses: 0 });

  const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring";

  const load = async () => {
    const list = await base44.entities.AppSetting.list("-created_date", 1);
    const s = list[0] || null;
    setSetting(s);
    if (s) setForm({ exchange_rate: s.exchange_rate, global_discount_percent: s.global_discount_percent || 0 });
    const [allItems, allCoupons] = await Promise.all([
      base44.entities.Item.list("-created_date", 200),
      base44.entities.Coupon.list("-created_date", 100),
    ]);
    setItems(allItems);
    setCoupons(allCoupons);
  };
  useEffect(() => { load().catch(() => setSetting({ none: true })); }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        exchange_rate: Number(form.exchange_rate),
        global_discount_percent: Number(form.global_discount_percent) || 0,
      };
      if (setting && !setting.none && setting.id) {
        await base44.entities.AppSetting.update(setting.id, payload);
      } else {
        await base44.entities.AppSetting.create(payload);
      }
      toast({ title: "Pricing settings saved" });
      await load();
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const applyItemDiscount = async (clear) => {
    if (selected.size === 0) { toast({ title: "Select at least one item", variant: "destructive" }); return; }
    if (!clear && (!itemDiscount || Number(itemDiscount) <= 0)) {
      toast({ title: "Enter a discount percentage", variant: "destructive" });
      return;
    }
    setApplying(true);
    try {
      const pct = clear ? 0 : Number(itemDiscount);
      const updates = items
        .filter((i) => selected.has(i.id))
        .map((i) => ({ id: i.id, discount_percent: pct }));
      await base44.entities.Item.bulkUpdate(updates);
      toast({ title: clear ? "Discounts cleared" : `Applied ${pct}% to ${updates.length} item(s)` });
      setSelected(new Set());
      setItemDiscount("");
      await load();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const createCoupon = async () => {
    if (!newCoupon.code.trim() || !newCoupon.discount_percent) {
      toast({ title: "Code and discount % are required", variant: "destructive" });
      return;
    }
    try {
      await base44.entities.Coupon.create({
        code: newCoupon.code.trim().toUpperCase(),
        discount_percent: Number(newCoupon.discount_percent),
        expires_at: newCoupon.expires_at || null,
        max_uses: Number(newCoupon.max_uses) || 0,
        active: true,
      });
      setNewCoupon({ code: "", discount_percent: "", expires_at: "", max_uses: 0 });
      toast({ title: "Coupon created" });
      await load();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const toggleCoupon = async (c) => {
    await base44.entities.Coupon.update(c.id, { active: !c.active });
    await load();
  };

  const deleteCoupon = async (c) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    await base44.entities.Coupon.delete(c.id);
    await load();
  };

  if (setting === null) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Price controlling</h1>

      {/* Currency + site-wide discount */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100"><Coins className="h-4 w-4 text-amber-600" /></div>
            <div>
              <h2 className="text-sm font-semibold">Currency converter (Dirham)</h2>
              <p className="text-xs text-muted-foreground">ETB per 1 AED</p>
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">1 AED = __ ETB</span>
            <input type="number" step="0.01" className={inp} value={form.exchange_rate} onChange={(e) => setForm((f) => ({ ...f, exchange_rate: e.target.value }))} />
          </label>
          <p className="mt-2 text-xs text-muted-foreground">Items priced in AED are converted across the whole marketplace. Change this rate and every AED-priced item updates instantly.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100"><Percent className="h-4 w-4 text-rose-600" /></div>
            <div>
              <h2 className="text-sm font-semibold">Site-wide discount</h2>
              <p className="text-xs text-muted-foreground">Applies to all items instantly</p>
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Discount percentage (%)</span>
            <input type="number" min="0" max="100" className={inp} value={form.global_discount_percent} onChange={(e) => setForm((f) => ({ ...f, global_discount_percent: e.target.value }))} />
          </label>
          <p className="mt-2 text-xs text-muted-foreground">Set 0 to turn off. Example: 10 reduces every displayed price by 10%.</p>
        </div>
      </div>

      <button onClick={saveSettings} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save rates &amp; site-wide discount
      </button>

      {/* Per-item discount tool */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100"><Tag className="h-4 w-4 text-indigo-600" /></div>
          <div>
            <h2 className="text-sm font-semibold">Discount selected items</h2>
            <p className="text-xs text-muted-foreground">Apply a percentage discount to only the items you choose</p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input type="number" min="0" max="100" placeholder="Discount %" className={inp + " w-32"} value={itemDiscount} onChange={(e) => setItemDiscount(e.target.value)} />
          <button onClick={() => applyItemDiscount(false)} disabled={applying} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Percent className="h-4 w-4" />} Apply to {selected.size} selected
          </button>
          <button onClick={() => applyItemDiscount(true)} disabled={applying} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50">
            Clear discount
          </button>
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
          {items.map((i) => (
            <button key={i.id} onClick={() => toggleSelect(i.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted">
              {selected.has(i.id) ? <CheckSquare className="h-4 w-4 shrink-0 text-primary" /> : <Square className="h-4 w-4 shrink-0 text-muted-foreground" />}
              <span className="flex-1 truncate text-sm">{i.title}</span>
              <span className="text-xs text-muted-foreground">{i.category}</span>
              {i.discount_percent > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">{i.discount_percent}% off</span>}
            </button>
          ))}
          {items.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No items yet.</p>}
        </div>
      </div>

      {/* Coupon codes */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100"><Ticket className="h-4 w-4 text-emerald-600" /></div>
          <div>
            <h2 className="text-sm font-semibold">Coupon codes</h2>
            <p className="text-xs text-muted-foreground">Create codes buyers can apply at checkout</p>
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Code</span>
            <input className={inp} value={newCoupon.code} onChange={(e) => setNewCoupon((c) => ({ ...c, code: e.target.value }))} placeholder="EID20" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Discount %</span>
            <input type="number" min="0" max="100" className={inp} value={newCoupon.discount_percent} onChange={(e) => setNewCoupon((c) => ({ ...c, discount_percent: e.target.value }))} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Expiry date</span>
            <input type="date" className={inp} value={newCoupon.expires_at} onChange={(e) => setNewCoupon((c) => ({ ...c, expires_at: e.target.value }))} />
          </label>
          <div className="flex items-end">
            <button onClick={createCoupon} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" /> Create
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          {coupons.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
              <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-semibold">{c.code}</span>
              <span className="text-sm font-medium text-rose-600">{c.discount_percent}% off</span>
              {c.expires_at && <span className="text-xs text-muted-foreground">expires {c.expires_at}</span>}
              <span className="text-xs text-muted-foreground">{c.usage_count || 0} uses{c.max_uses > 0 ? ` / ${c.max_uses}` : ""}</span>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => toggleCoupon(c)} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                  {c.active ? "Active" : "Inactive"}
                </button>
                <button onClick={() => deleteCoupon(c)} className="rounded-full p-2 text-rose-500 hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {coupons.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No coupons yet. Create one above.</p>}
        </div>
      </div>
    </div>
  );
}