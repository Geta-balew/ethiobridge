import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function(req) {
  try {
    const body = await req.json();
    const { order_id, rating, comment } = body;
    if (!order_id) return Response.json({ error: "order_id is required" }, { status: 400 });
    const r = Number(rating);
    if (!r || r < 1 || r > 5) return Response.json({ error: "Rating must be 1-5" }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    const order = orders[0];
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
    if (order.created_by_id !== user.id && user.role !== "admin") {
      return Response.json({ error: "You can only review your own orders" }, { status: 403 });
    }
    if (order.picker_status !== "delivered") {
      return Response.json({ error: "You can only review after delivery" }, { status: 400 });
    }
    if (!order.picker_id) return Response.json({ error: "No picker assigned" }, { status: 400 });
    if (order.buyer_rated) return Response.json({ error: "You already reviewed this picker" }, { status: 409 });

    await base44.asServiceRole.entities.Review.create({
      order_id,
      picker_id: order.picker_id,
      buyer_name: order.buyer_name || user.full_name || "Buyer",
      rating: r,
      comment: comment || "",
    });

    // Update picker rating (running average)
    const pickers = await base44.asServiceRole.entities.Picker.filter({ id: order.picker_id });
    const picker = pickers[0];
    if (picker) {
      const count = Number(picker.reviews_count || 0);
      const prevAvg = Number(picker.rating || 0);
      const newCount = count + 1;
      const newAvg = (prevAvg * count + r) / newCount;
      await base44.asServiceRole.entities.Picker.update(picker.id, {
        rating: Math.round(newAvg * 10) / 10,
        reviews_count: newCount,
      });
    }

    await base44.asServiceRole.entities.Order.update(order_id, { buyer_rated: true });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}