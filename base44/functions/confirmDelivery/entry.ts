import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function(req) {
  try {
    const body = await req.json();
    const { order_id, code } = body;
    if (!order_id || !code) {
      return Response.json({ error: "order_id and code are required" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    const order = orders[0];
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const isAssignedPicker = order.picker_id === user.id;
    const isAdmin = user.role === "admin";
    if (!isAssignedPicker && !isAdmin) {
      return Response.json({ error: "Not authorized for this order" }, { status: 403 });
    }

    if (String(order.delivery_code) !== String(code)) {
      return Response.json({ error: "Incorrect delivery code" }, { status: 400 });
    }

    await base44.asServiceRole.entities.Order.update(order_id, {
      picker_status: "delivered",
      status: "delivered",
    });

    // Credit the picker's wallet with the picker fee
    if (order.picker_id) {
      const pickers = await base44.asServiceRole.entities.Picker.filter({ created_by_id: order.picker_id });
      if (pickers[0]) {
        const fee = Number(order.picker_fee) || 0;
        await base44.asServiceRole.entities.Picker.update(pickers[0].id, {
          wallet_balance: (Number(pickers[0].wallet_balance) || 0) + fee,
          total_earnings: (Number(pickers[0].total_earnings) || 0) + fee,
          total_deliveries: (Number(pickers[0].total_deliveries) || 0) + 1,
        });
      }
    }

    return Response.json({ ok: true, order_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}