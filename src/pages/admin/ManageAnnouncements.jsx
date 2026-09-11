import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Trash2, Megaphone, X } from "lucide-react";

const empty = { title: "", body: "", active: true, sort_order: 0 };

export default function ManageAnnouncements() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => setItems(await base44.entities.Announcement.list("sort_order", 50));
  useEffect(() => { load().catch(() => setItems([])); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = async () => {
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await base44.entities.Announcement.create({
        title: form.title,
        body: form.body,
        active: form.active,
        sort_order: Number(form.sort_order) || 0,
      });
      setForm(empty);
      toast({ title: "Announcement added" });
      await load();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (a) => {
    await base44.entities.Announcement.update(a.id, { active: !a.active });
    await load();
  };

  const remove = async (a) => {
    if (!confirm(`Delete "${a.title}"?`)) return;
    await base44.entities.Announcement.delete(a.id);
    await load();
  };

  const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">News &amp; announcements</h1>

      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Megaphone className="h-4 w-4 text-amber-600" /> New announcement</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</span>
            <input className={inp} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Eid Sale — 20% off all electronics!" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Body (optional)</span>
            <input className={inp} value={form.body} onChange={(e) => set("body", e.target.value)} placeholder="Short detail shown after the title" />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Active</label>
          <label className="flex items-center gap-2 text-sm">
            Sort order
            <input type="number" className={inp + " w-24"} value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
          </label>
          <button onClick={create} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </button>
        </div>
      </div>

      {items === null ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No announcements yet. Add one above to show it in the homepage ticker.</p>
      ) : (
        <div className="grid gap-2">
          {items.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <Megaphone className="h-4 w-4 shrink-0 text-amber-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.title}</p>
                {a.body && <p className="truncate text-xs text-muted-foreground">{a.body}</p>}
              </div>
              <button onClick={() => toggle(a)} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${a.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                {a.active ? "Active" : "Hidden"}
              </button>
              <button onClick={() => remove(a)} className="rounded-full p-2 text-rose-500 hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}