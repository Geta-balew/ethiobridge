import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Package, UserCheck, ClipboardList, TrendingUp, Loader2, SlidersHorizontal, Banknote, Truck, ShoppingBag } from "lucide-react";

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
        const totalTransactions = orders.length;
        const totalPaidItems = orders.reduce((s, o) => s + (o.subtotal || 0), 0);
        const totalPaidDelivery = orders.reduce((s, o) => s + (o.delivery_fee || 0) + (o.picker_fee || 0), 0);
        const netProfit = orders.reduce((s, o) => s + (o.subtotal || 0) - (o.picker_fee || 0), 0);
        const pendingPickers = pickers.filter((p) => p.verification_status === "pending").length;
        const activeOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length;
        setStats({
          items: items.length, pickers: pickers.length, pendingPickers,
          orders: orders.length, activeOrders,
          totalTransactions, totalPaidItems, totalPaidDelivery, netProfit,
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

  const finance = [
    { label: "Total Transactions", value: stats.totalTransactions, icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
    { label: "Net Profit", value: `${stats.netProfit.toLocaleString()} ETB`, icon: Banknote, color: "text-emerald-600 bg-emerald-50" },
    { label: "Total Paid for Delivery", value: `${stats.totalPaidDelivery.toLocaleString()} ETB`, icon: Truck, color: "text-amber-600 bg-amber-50" },
    { label: "Total Paid for Items", value: `${stats.totalPaidItems.toLocaleString()} ETB`, icon: ShoppingBag, color: "text-purple-600 bg-purple-50" },
  ];

  const cards = [
    { label: "Items", value: stats.items, icon: Package, to: "/admin/items", color: "text-blue-600 bg-blue-50" },
    { label: "Pickers", value: stats.pickers, icon: UserCheck, to: "/admin/pickers", color: "text-emerald-600 bg-emerald-50" },
    { label: "Pending verifications", value: stats.pendingPickers, icon: UserCheck, to: "/admin/pickers", color: "text-amber-600 bg-amber-50" },
    { label: "Active orders", value: stats.activeOrders, icon: ClipboardList, to: "/admin/orders", color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {finance.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-semibold">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

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

      <Link to="/admin/settings" className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-gradient-to-r from-amber-50 to-rose-50 p-5 transition hover:shadow-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <SlidersHorizontal className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold">Price Controlling</h2>
          <p className="text-sm text-muted-foreground">Currency rates, site-wide &amp; per-item discounts, and coupon codes</p>
        </div>
        <span className="text-sm font-medium text-primary">Open →</span>
      </Link>
    </div>
  );
}