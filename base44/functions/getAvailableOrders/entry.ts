import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Confirm the caller is a verified picker
    const pickers = await base44.asServiceRole.entities.Picker.filter({
      created_by_id: user.id,
      verification_status: "verified",
    });
    const isVerified = pickers.length > 0 || user.role === "admin";
    if (!isVerified) {
      return Response.json({ error: "You are not a verified picker" }, { status: 403 });
    }

    // Unassigned, paid (or manual-confirmed) orders ready to be picked
    const orders = await base44.asServiceRole.entities.Order.filter({
      picker_status: "unassigned",
      payment_status: { $in: ["paid", "manual_confirmed"] },
    }, "-created_date", 100);

    // Return a safe summary (no sensitive buyer contact until claimed)
    const summary = orders.map((o) => ({
      id: o.id,
      created_date: o.created_date,
      items: o.items,
      subtotal: o.subtotal,
      picker_fee: o.picker_fee,
      total: o.total,
      delivery_region: o.delivery_region,
      delivery_city: o.delivery_city,
      flight_date: o.flight_date,
      payment_status: o.payment_status,
    }));

    return Response.json({ orders: summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}