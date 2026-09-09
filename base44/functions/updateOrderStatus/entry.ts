import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function(req) {
  try {
    const body = await req.json();
    const { order_id, picker_status } = body;
    const valid = ["claimed", "picked", "in_transit", "delivered", "cancelled"];
    if (!order_id || !valid.includes(picker_status)) {
      return Response.json({ error: "order_id and a valid picker_status are required" }, { status: 400 });
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

    const update = { picker_status };
    if (picker_status === "delivered") {
      update.status = "delivered";
    }
    await base44.asServiceRole.entities.Order.update(order_id, update);

    // Credit the picker's delivery count on completion
    if (picker_status === "delivered" && order.picker_id) {
      const pickers = await base44.asServiceRole.entities.Picker.filter({ created_by_id: order.picker_id });
      if (pickers[0]) {
        await base44.asServiceRole.entities.Picker.update(pickers[0].id, {
          total_deliveries: (pickers[0].total_deliveries || 0) + 1,
        });
      }
    }

    return Response.json({ ok: true, order_id, picker_status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}