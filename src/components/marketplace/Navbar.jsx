import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Plane, LayoutDashboard, User, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function Navbar({ onSearch }) {
  const { count } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState(null);

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

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
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
            placeholder="Search items…"
            className="h-10 w-full rounded-full border border-input bg-muted/40 pl-9 pr-4 text-sm outline-none transition focus:border-ring focus:bg-background"
          />
        </form>

        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <Link to="/admin" className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm hover:bg-muted sm:inline-flex">
              <LayoutDashboard className="h-4 w-4" /> Admin
            </Link>
          )}
          {user && (
            <Link to="/picker" className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm hover:bg-muted sm:inline-flex">
              <User className="h-4 w-4" /> Picker
            </Link>
          )}
          {user && (
            <button onClick={logout} className="hidden h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted sm:inline-flex" aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => navigate("/checkout")}
            className="relative inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}