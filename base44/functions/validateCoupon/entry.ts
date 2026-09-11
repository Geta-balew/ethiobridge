import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function(req) {
  try {
    const body = await req.json();
    const { code } = body;
    if (!code) return Response.json({ valid: false, message: "Enter a coupon code" }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const coupons = await base44.asServiceRole.entities.Coupon.filter({
      code: String(code).trim(),
      active: true,
    });
    const coupon = coupons[0];
    if (!coupon) return Response.json({ valid: false, message: "Invalid coupon code" });

    if (coupon.expires_at) {
      const expiry = new Date(coupon.expires_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiry < today) {
        return Response.json({ valid: false, message: "This coupon has expired" });
      }
    }

    if (coupon.max_uses && Number(coupon.max_uses) > 0 && (Number(coupon.usage_count) || 0) >= Number(coupon.max_uses)) {
      return Response.json({ valid: false, message: "This coupon has reached its usage limit" });
    }

    return Response.json({
      valid: true,
      discount_percent: Number(coupon.discount_percent),
      code: coupon.code,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}