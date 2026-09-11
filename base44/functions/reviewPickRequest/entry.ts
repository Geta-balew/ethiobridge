import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function(req) {
  try {
    const body = await req.json();
    const { order_id, approved } = body;
    if (!order_id) return Response.json({ error: "order_id is required" }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    const order = orders[0];
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
    if (order.pick_request_status !== "requested") {
      return Response.json({ error: "No pending pick request for this order" }, { status: 409 });
    }

    if (approved) {
      if (!order.requested_picker_id) {
        return Response.json({ error: "No picker requested this order" }, { status: 400 });
      }
      await base44.asServiceRole.entities.Order.update(order_id, {
        picker_id: order.requested_picker_id,
        pick_request_status: "approved",
        picker_status: "claimed",
      });
    } else {
      await base44.asServiceRole.entities.Order.update(order_id, {
        pick_request_status: "rejected",
        requested_picker_id: "",
      });
    }

    return Response.json({ ok: true, order_id, approved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}