import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";

const CHAPA_API = "https://api.chapa.co/v1/transaction/initialize";

export default async function(req) {
  try {
    const body = await req.json();
    const { booking_id, amount, buyer_email, buyer_name, return_url } = body;

    if (!booking_id || !amount) {
      return Response.json({ error: "booking_id and amount are required" }, { status: 400 });
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
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const tx_ref = `TKT-${booking_id.slice(-6)}-${Date.now()}`;
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
        return_url: return_url,
        customization: {
          title: "EthioBridge Tickets",
          description: "Payment for your flight ticket booking",
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

    try {
      await base44.asServiceRole.entities.TicketBooking.update(booking_id, {
        chapa_tx_ref: tx_ref,
        payment_status: "pending",
        payment_method: "chapa",
      });
    } catch (_e) {
      // best-effort
    }

    return Response.json({
      checkout_url: chapaData.data.checkout_url,
      tx_ref,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}