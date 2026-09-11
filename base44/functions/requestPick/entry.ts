import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function(req) {
  try {
    const body = await req.json();
    const { order_id, trips } = body;
    if (!order_id) return Response.json({ error: "order_id is required" }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Must be a verified picker
    const pickers = await base44.asServiceRole.entities.Picker.filter({
      created_by_id: user.id,
      verification_status: "verified",
    });
    if (pickers.length === 0 && user.role !== "admin") {
      return Response.json({ error: "You are not a verified picker" }, { status: 403 });
    }

    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    const order = orders[0];
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
    if (order.picker_status !== "unassigned") {
      return Response.json({ error: "Order is no longer available" }, { status: 409 });
    }
    if (order.payment_status !== "paid" && order.payment_status !== "manual_confirmed") {
      return Response.json({ error: "Order payment is not confirmed yet" }, { status: 409 });
    }

    await base44.asServiceRole.entities.Order.update(order_id, {
      requested_picker_id: user.id,
      pick_request_status: "requested",
      pick_request_trips: Number(trips) || 0,
    });

    return Response.json({ ok: true, order_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}