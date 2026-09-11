import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LayoutDashboard, Package, UserCheck, ClipboardList, Plane, Ticket, FileText, Settings, Megaphone, LogOut, Loader2 } from "lucide-react";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/items", label: "Items", icon: Package },
  { to: "/admin/pickers", label: "Pickers", icon: UserCheck },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/tickets", label: "Flights", icon: Plane },
  { to: "/admin/bookings", label: "Bookings", icon: Ticket },
  { to: "/admin/visas", label: "Visas", icon: FileText },
  { to: "/admin/announcements", label: "News", icon: Megaphone },
  { to: "/admin/settings", label: "Price Controlling", icon: Settings },
];

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-lg font-semibold">Admin access only</p>
        <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>
        <Link to="/" className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">Back to marketplace</Link>
      </div>
    );
  }

  const logout = async () => {
    await base44.auth.logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Plane className="h-5 w-5" />
            </div>
            <div className="leading-none">
              <span className="block text-sm font-semibold">Addis Bazaar</span>
              <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Admin</span>
            </div>
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                  }`
                }
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button onClick={logout} className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </aside>

        {/* Mobile top bar */}
        <div className="flex w-full flex-col">
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
            <span className="font-semibold">Admin</span>
            <div className="flex gap-1">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className="rounded-lg p-2 hover:bg-muted">
                  <n.icon className="h-4 w-4" />
                </NavLink>
              ))}
            </div>
          </div>
          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}