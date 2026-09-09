import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";

const CHAPA_VERIFY = "https://api.chapa.co/v1/transaction/verify/";

export default async function(req) {
  try {
    const url = new URL(req.url);
    const tx_ref = url.searchParams.get("tx_ref");
    const order_id = url.searchParams.get("order_id");

    if (!tx_ref) {
      return Response.json({ error: "tx_ref is required" }, { status: 400 });
    }

    const secretKey = secrets.get("CHAPA_SECRET_KEY");
    if (!secretKey) {
      return Response.json({ error: "Chapa not configured" }, { status: 503 });
    }

    const base44 = createClientFromRequest(req);

    const verifyRes = await fetch(`${CHAPA_VERIFY}${tx_ref}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const verifyData = await verifyRes.json();

    const status = verifyData?.data?.status;
    const paid = status === "success" || status === "paid";

    if (paid && order_id) {
      await base44.asServiceRole.entities.Order.update(order_id, {
        payment_status: "paid",
      });
    }

    return Response.json({ paid, status, raw: verifyData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}