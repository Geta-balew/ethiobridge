import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Plane, LayoutDashboard, User, LogOut, FileText, Menu, X, Package, Users } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";

export default function Navbar({ onSearch }) {
  const { count } = useCart();
  const { t } = useLang();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const submit = (e) => {
    e.preventDefault();
    onSearch?.(query);
  };

  const logout = async () => {
    await base44.auth.logout();
    window.location.href = "/";
  };

  const links = [
    { to: "/tickets", label: t("tickets"), icon: Plane, show: true },
    { to: "/visa", label: t("visa"), icon: FileText, show: true },
    { to: "/pickers", label: t("pickers"), icon: Users, show: true },
    { to: "/orders", label: t("my_orders"), icon: Package, show: !!user },
    { to: "/picker", label: t("picker"), icon: User, show: !!user },
    { to: "/admin", label: t("admin"), icon: LayoutDashboard, show: user?.role === "admin" },
  ].filter((l) => l.show);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Plane className="h-5 w-5" />
          </div>
          <div className="hidden sm:block leading-none">
            <span className="block text-sm font-semibold tracking-tight">Addis Bazaar</span>
            <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
              Dubai → Addis
            </span>
          </div>
        </Link>

        <form onSubmit={submit} className="relative flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            className="h-10 w-full rounded-full border border-input bg-muted/40 pl-9 pr-4 text-sm outline-none transition focus:border-ring focus:bg-background"
          />
        </form>

        <div className="flex items-center gap-2">
          {/* Desktop links */}
          <div className="hidden items-center gap-2 md:flex">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm hover:bg-muted">
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}
            {user && (
              <button onClick={logout} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted" aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>

          <ThemeToggle />
          <LanguageToggle />
          <button
            onClick={() => navigate("/checkout")}
            className="relative inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">{t("cart")}</span>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted md:hidden"
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted"
                >
                  <l.icon className="h-4 w-4" /> {l.label}
                </Link>
              ))}
              {user && (
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}