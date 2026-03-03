import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { recomputeInvestorBalances } from "@/lib/investors/capital";
import { investorTransactionSchema } from "@/lib/validations";
import { createSupabaseServerClient } from "@/supabase/server";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json();
  const payload = investorTransactionSchema.safeParse(raw);
  if (!payload.success) return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  const normalizedPayload = {
    ...payload.data,
    transaction_type:
      payload.data.transaction_type === "LOAN_ALLOCATION"
        ? "ALLOCATION"
        : payload.data.transaction_type === "RETURN_PAYMENT"
          ? "RETURN"
          : payload.data.transaction_type,
  };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("investor_transactions").insert(normalizedPayload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await recomputeInvestorBalances(normalizedPayload.investor_id);
  return NextResponse.json(data, { status: 201 });
}
