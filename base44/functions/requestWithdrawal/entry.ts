import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function(req) {
  try {
    const body = await req.json();
    const { amount, bank_account } = body;
    if (!amount || Number(amount) <= 0) return Response.json({ error: "Enter a valid amount" }, { status: 400 });
    if (!bank_account || !String(bank_account).trim()) {
      return Response.json({ error: "Bank account details are required" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const pickers = await base44.asServiceRole.entities.Picker.filter({ created_by_id: user.id });
    const picker = pickers[0];
    if (!picker) return Response.json({ error: "Picker profile not found" }, { status: 404 });
    if (picker.verification_status !== "verified") {
      return Response.json({ error: "Only verified pickers can withdraw" }, { status: 403 });
    }

    const amt = Number(amount);
    if (amt > Number(picker.wallet_balance || 0)) {
      return Response.json({ error: "Amount exceeds your wallet balance" }, { status: 400 });
    }

    await base44.asServiceRole.entities.WithdrawalRequest.create({
      picker_id: picker.id,
      picker_name: picker.full_name,
      amount: amt,
      bank_account: String(bank_account).trim(),
      status: "pending",
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}