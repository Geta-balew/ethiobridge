import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function(req) {
  try {
    const body = await req.json();
    const { withdrawal_id, approved, admin_note } = body;
    if (!withdrawal_id) return Response.json({ error: "withdrawal_id is required" }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    const reqs = await base44.asServiceRole.entities.WithdrawalRequest.filter({ id: withdrawal_id });
    const w = reqs[0];
    if (!w) return Response.json({ error: "Withdrawal not found" }, { status: 404 });
    if (w.status !== "pending") return Response.json({ error: "Already processed" }, { status: 409 });

    if (approved) {
      const pickers = await base44.asServiceRole.entities.Picker.filter({ id: w.picker_id });
      const picker = pickers[0];
      if (picker) {
        const newBalance = Math.max(0, Number(picker.wallet_balance || 0) - Number(w.amount || 0));
        await base44.asServiceRole.entities.Picker.update(picker.id, { wallet_balance: newBalance });
      }
      await base44.asServiceRole.entities.WithdrawalRequest.update(withdrawal_id, {
        status: "approved",
        admin_note: admin_note || "Approved",
      });
    } else {
      await base44.asServiceRole.entities.WithdrawalRequest.update(withdrawal_id, {
        status: "rejected",
        admin_note: admin_note || "Rejected",
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}