import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Percent, Coins } from "lucide-react";

export default function PriceControls() {
  const [setting, setSetting] = useState(null);
  const [form, setForm] = useState({ exchange_rate: 52, global_discount_percent: 0 });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const list = await base44.entities.AppSetting.list("-created_date", 1);
    const s = list[0] || null;
    setSetting(s);
    if (s) setForm({ exchange_rate: s.exchange_rate, global_discount_percent: s.global_discount_percent || 0 });
  };
  useEffect(() => { load().catch(() => setSetting({ none: true })); }, []);

  const save = async () => {
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

  if (setting === null) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Pricing controls</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100"><Coins className="h-4 w-4 text-amber-600" /></div>
            <div>
              <h2 className="text-sm font-semibold">Exchange rate</h2>
              <p className="text-xs text-muted-foreground">ETB per 1 AED (Dirham)</p>
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">1 AED = __ ETB</span>
            <input type="number" step="0.01" className={inp} value={form.exchange_rate} onChange={(e) => setForm((f) => ({ ...f, exchange_rate: e.target.value }))} />
          </label>
          <p className="mt-2 text-xs text-muted-foreground">
            Items priced in AED are multiplied by this rate to show ETB prices across the marketplace. Update it whenever the rate changes.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100"><Percent className="h-4 w-4 text-rose-600" /></div>
            <div>
              <h2 className="text-sm font-semibold">Global discount</h2>
              <p className="text-xs text-muted-foreground">Applies to all items</p>
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Discount percentage (%)</span>
            <input type="number" min="0" max="100" className={inp} value={form.global_discount_percent} onChange={(e) => setForm((f) => ({ ...f, global_discount_percent: e.target.value }))} />
          </label>
          <p className="mt-2 text-xs text-muted-foreground">
            Set a site-wide discount (e.g. 10) to reduce every displayed price by that percentage. Set 0 to turn it off.
          </p>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save settings
      </button>
    </div>
  );
}