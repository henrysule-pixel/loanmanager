import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { loanPaymentSchema } from "@/lib/validations";
import { createSupabaseServerClient } from "@/supabase/server";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json();
  const payload = loanPaymentSchema.safeParse(raw);
  if (!payload.success) return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  const normalizedPayload = {
    ...payload.data,
    amount: payload.data.amount ?? payload.data.payment_amount,
    payment_amount: payload.data.payment_amount ?? payload.data.amount,
  };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("loan_payments").insert(normalizedPayload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
