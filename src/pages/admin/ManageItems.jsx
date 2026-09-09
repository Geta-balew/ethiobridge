import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image as Img } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, X, Upload, Loader2, Zap, Tag, CheckCircle2 } from "lucide-react";

const CATEGORIES = ["Electronics", "Fashion", "Home & Living", "Beauty & Health", "Groceries", "Kids", "Other"];
const empty = {
  title: "", description: "", price: "", discounted_price: "", category: "Electronics",
  stock: 1, images: [], is_offer: false, is_deal: false, offer_label: "", status: "draft",
};

export default function ManageItems() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const data = await base44.entities.Item.list("-created_date", 100);
    setItems(data);
  };
  useEffect(() => { load().catch(() => setItems([])); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("images", [...form.images, file_url]);
    } catch (e) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => set("images", form.images.filter((_, i) => i !== idx));

  const openNew = () => { setEditing("new"); setForm(empty); };
  const openEdit = (item) => {
    setEditing(item.id);
    setForm({ ...empty, ...item, price: item.price ?? "", discounted_price: item.discounted_price ?? "" });
  };

  const save = async () => {
    if (!form.title || !form.price) {
      toast({ title: "Title and price are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discounted_price: form.discounted_price ? Number(form.discounted_price) : null,
        stock: Number(form.stock) || 0,
      };
      if (editing === "new") {
        await base44.entities.Item.create(payload);
      } else {
        await base44.entities.Item.update(editing, payload);
      }
      toast({ title: "Item saved" });
      setEditing(null);
      await load();
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await base44.entities.Item.delete(item.id);
    await load();
  };

  const publish = async (item) => {
    await base44.entities.Item.update(item.id, { status: "published" });
    await load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Items</h1>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> Upload item
        </button>
      </div>

      {items === null ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {item.images?.[0] && <Img src={item.images[0]} alt="" className="h-full w-full object-cover" fittingType="fill" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{item.title}</p>
                  {item.is_deal && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700"><Zap className="h-3 w-3" />Deal</span>}
                  {item.is_offer && <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700"><Tag className="h-3 w-3" />Offer</span>}
                </div>
                <p className="text-sm text-muted-foreground">{Number(item.price).toLocaleString()} ETB · Stock {item.stock} · <span className="capitalize">{item.status}</span></p>
              </div>
              {item.status !== "published" && (
                <button onClick={() => publish(item)} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Publish
                </button>
              )}
              <button onClick={() => openEdit(item)} className="rounded-full p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(item)} className="rounded-full p-2 text-rose-500 hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {items.length === 0 && <p className="py-12 text-center text-muted-foreground">No items yet. Upload your first item.</p>}
        </div>
      )}

      {/* Editor drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setEditing(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing === "new" ? "Upload item" : "Edit item"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <L label="Title"><input className={inp} value={form.title} onChange={(e) => set("title", e.target.value)} /></L>
              <L label="Description"><textarea className={inp + " min-h-20"} value={form.description} onChange={(e) => set("description", e.target.value)} /></L>
              <div className="grid grid-cols-2 gap-3">
                <L label="Price (ETB)"><input type="number" className={inp} value={form.price} onChange={(e) => set("price", e.target.value)} /></L>
                <L label="Discounted price (ETB)"><input type="number" className={inp} value={form.discounted_price} onChange={(e) => set("discounted_price", e.target.value)} /></L>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <L label="Category">
                  <select className={inp} value={form.category} onChange={(e) => set("category", e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </L>
                <L label="Stock"><input type="number" className={inp} value={form.stock} onChange={(e) => set("stock", e.target.value)} /></L>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Images</p>
                <div className="flex flex-wrap gap-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                      <Img src={img} alt="" className="h-full w-full object-cover" fittingType="fill" />
                      <button onClick={() => removeImage(i)} className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-muted hover:bg-muted/70">
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadImage(e.target.files[0])} />
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_deal} onChange={(e) => set("is_deal", e.target.checked)} /> Deal of the day</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_offer} onChange={(e) => set("is_offer", e.target.checked)} /> Special offer</label>
              </div>
              <L label="Offer label (e.g. 30% OFF)"><input className={inp} value={form.offer_label} onChange={(e) => set("offer_label", e.target.value)} /></L>
              <L label="Status">
                <select className={inp} value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="verified">Verified</option>
                  <option value="published">Published</option>
                </select>
              </L>

              <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring";
function L({ label, children }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}