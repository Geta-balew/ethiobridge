import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Package, UserCheck, ClipboardList, TrendingUp, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [items, pickers, orders] = await Promise.all([
          base44.entities.Item.list(),
          base44.entities.Picker.list(),
          base44.entities.Order.list(),
        ]);
        const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
        const pendingPickers = pickers.filter((p) => p.verification_status === "pending").length;
        const activeOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length;
        setStats({
          items: items.length,
          pickers: pickers.length,
          pendingPickers,
          orders: orders.length,
          activeOrders,
          revenue,
        });
      } catch (e) {
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const cards = [
    { label: "Items", value: stats.items, icon: Package, to: "/admin/items", color: "text-blue-600 bg-blue-50" },
    { label: "Pickers", value: stats.pickers, icon: UserCheck, to: "/admin/pickers", color: "text-emerald-600 bg-emerald-50" },
    { label: "Pending verifications", value: stats.pendingPickers, icon: UserCheck, to: "/admin/pickers", color: "text-amber-600 bg-amber-50" },
    { label: "Active orders", value: stats.activeOrders, icon: ClipboardList, to: "/admin/orders", color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-2xl border border-border bg-card p-5 transition hover:shadow-md">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-semibold">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-semibold">Total order value</h2>
        </div>
        <p className="mt-2 text-3xl font-semibold">{(stats.revenue || 0).toLocaleString()} <span className="text-base text-muted-foreground">ETB</span></p>
      </div>
    </div>
  );
}