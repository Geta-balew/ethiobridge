import { useLang } from "@/context/LanguageContext";

export default function LanguageToggle() {
  const { lang, toggle } = useLang();
  return (
    <button onClick={toggle} className="inline-flex h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted" aria-label="Toggle language">
      {lang === "en" ? "አማ" : "EN"}
    </button>
  );
}