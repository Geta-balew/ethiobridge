import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";

const CHAPA_API = "https://api.chapa.co/v1/transaction/initialize";

export default async function(req) {
  try {
    const body = await req.json();
    const { order_id, amount, buyer_email, buyer_name, return_url } = body;

    if (!order_id || !amount) {
      return Response.json({ error: "order_id and amount are required" }, { status: 400 });
    }

    const secretKey = secrets.get("CHAPA_SECRET_KEY");
    if (!secretKey) {
      return Response.json(
        { error: "Chapa payment is not configured. Add CHAPA_SECRET_KEY in dashboard settings." },
        { status: 503 }
      );
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    const tx_ref = `ABZ-${order_id.slice(-6)}-${Date.now()}`;
    const [first_name, ...rest] = (buyer_name || "Customer").split(" ");

    const chapaRes = await fetch(CHAPA_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: String(amount),
        currency: "ETB",
        tx_ref,
        first_name,
        last_name: rest.join(" ") || "Customer",
        email: buyer_email || "customer@example.com",
        return_url: return_url || body.return_url,
        customization: {
          title: "Addis Bazaar",
          description: "Payment for your Dubai → Addis order",
        },
      }),
    });

    const chapaData = await chapaRes.json();

    if (!chapaRes.ok || !chapaData?.data?.checkout_url) {
      return Response.json(
        { error: chapaData?.message || "Chapa initialization failed" },
        { status: 502 }
      );
    }

    // Record the tx_ref on the order (service role so it works regardless of RLS)
    try {
      await base44.asServiceRole.entities.Order.update(order_id, {
        chapa_tx_ref: tx_ref,
        payment_status: "pending",
      });
    } catch (_e) {
      // best-effort; the checkout_url is still returned
    }

    return Response.json({
      checkout_url: chapaData.data.checkout_url,
      tx_ref,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}