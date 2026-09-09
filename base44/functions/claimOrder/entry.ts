import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function(req) {
  try {
    const body = await req.json();
    const { order_id } = body;
    if (!order_id) return Response.json({ error: "order_id is required" }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

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
    if (order.picker_status !== "unassigned" && order.picker_id !== user.id) {
      return Response.json({ error: "Order already claimed" }, { status: 409 });
    }

    await base44.asServiceRole.entities.Order.update(order_id, {
      picker_id: user.id,
      picker_status: "claimed",
    });

    return Response.json({ ok: true, order_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}