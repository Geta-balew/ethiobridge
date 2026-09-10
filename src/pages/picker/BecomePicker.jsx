import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image as Img } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Upload, Loader2, ShieldCheck } from "lucide-react";

export default function BecomePicker() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", passport_number: "", national_id_number: "", bio: "", bank_account: "",
    flight_date: "", previous_trips_count: 0, first_time_status: "first_time_traveler",
  });
  const [passportImg, setPassportImg] = useState("");
  const [ticketImg, setTicketImg] = useState("");
  const [idImg, setIdImg] = useState("");
  const [permitImg, setPermitImg] = useState("");
  const [uploading, setUploading] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const upload = async (file, field, setter) => {
    setUploading(field);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setter(file_url);
    } catch (e) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const submit = async () => {
    if (!form.full_name || !form.phone || !form.passport_number || !form.national_id_number) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (!passportImg || !idImg) {
      toast({ title: "Passport and National ID photos are required", variant: "destructive" });
      return;
    }
    if (!form.flight_date) {
      toast({ title: "Please enter your next flight date", variant: "destructive" });
      return;
    }
    if (!ticketImg) {
      toast({ title: "Flight ticket photo is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Picker.create({
        ...form,
        passport_image: passportImg,
        national_id_image: idImg,
        dubai_residence_permit: permitImg,
        flight_ticket_image: ticketImg,
        verification_status: "pending",
      });
      toast({ title: "Application submitted!", description: "We'll review your documents shortly." });
      navigate("/picker");
    } catch (e) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Link to="/picker" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-semibold">Become a picker</h1>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">
            Pickers carry items from Dubai to Addis Ababa and deliver them to buyers across Ethiopia.
            You must be a legally accountable person — please provide accurate verification details.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FL label="Full name" required><input className={inp} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></FL>
            <FL label="Phone" required><input className={inp} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+971…" /></FL>
            <FL label="Email"><input className={inp} value={form.email} onChange={(e) => set("email", e.target.value)} /></FL>
            <FL label="Bank account (for payout)"><input className={inp} value={form.bank_account} onChange={(e) => set("bank_account", e.target.value)} /></FL>
            <FL label="Passport number" required><input className={inp} value={form.passport_number} onChange={(e) => set("passport_number", e.target.value)} /></FL>
            <FL label="Ethiopian national ID number" required><input className={inp} value={form.national_id_number} onChange={(e) => set("national_id_number", e.target.value)} /></FL>
            <FL label="Next flight date" required><input type="date" className={inp} value={form.flight_date} onChange={(e) => set("flight_date", e.target.value)} /></FL>
            <FL label="Previous trips to Dubai" required><input type="number" min="0" className={inp} value={form.previous_trips_count} onChange={(e) => set("previous_trips_count", Number(e.target.value))} /></FL>
            <FL label="Traveler status (customs risk)" required>
              <select className={inp} value={form.first_time_status} onChange={(e) => set("first_time_status", e.target.value)}>
                <option value="first_time_traveler">First-time traveler</option>
                <option value="occasional_traveler">Occasional traveler</option>
                <option value="frequent_traveler">Frequent traveler</option>
                <option value="business_traveler">Business traveler</option>
              </select>
            </FL>
            <FL label="Short bio" full><textarea className={inp + " min-h-16"} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Tell us about your travel frequency Dubai → Addis…" /></FL>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Photo label="Passport front page" required value={passportImg} uploading={uploading === "passport"} onUpload={(f) => upload(f, "passport", setPassportImg)} />
            <Photo label="National ID photo" required value={idImg} uploading={uploading === "id"} onUpload={(f) => upload(f, "id", setIdImg)} />
            <Photo label="Dubai residence permit / visa" value={permitImg} uploading={uploading === "permit"} onUpload={(f) => upload(f, "permit", setPermitImg)} />
            <Photo label="Flight ticket photo" required value={ticketImg} uploading={uploading === "ticket"} onUpload={(f) => upload(f, "ticket", setTicketImg)} />
          </div>

          <button onClick={submit} disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit application"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring";
function FL({ label, required, children, full }) {
  return <label className={`block ${full ? "sm:col-span-2" : ""}`}><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}
function Photo({ label, required, value, uploading, onUpload }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}{required && <span className="text-rose-500"> *</span>}</span>
      {value ? (
        <div className="h-24 w-full overflow-hidden rounded-lg border border-border"><Img src={value} alt="" className="h-full w-full object-cover" fittingType="fill" /></div>
      ) : (
        <label className="flex h-24 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-muted hover:bg-muted/70">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} />
        </label>
      )}
      {value && (
        <label className="mt-1 cursor-pointer text-[11px] text-primary underline">
          Change
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} />
        </label>
      )}
    </div>
  );
}