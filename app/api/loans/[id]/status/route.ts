import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assertValidLoanStatusTransition } from "@/lib/loans/status-workflow";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

const statusSchema = z.object({
  loan_status: z.enum([
    "APPLICATION",
    "UNDER_REVIEW",
    "APPROVED",
    "FUNDED",
    "ACTIVE",
    "LATE",
    "DEFAULTED",
    "CLOSED",
  ]),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json();
  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: loanData, error: loanLookupError } = await supabase
    .from("loans")
    .select("loan_status, status")
    .eq("id", params.id)
    .single();
  if (loanLookupError || !loanData) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

  try {
    const currentStatus = (loanData.status ?? loanData.loan_status) as Database["public"]["Enums"]["loan_status"];
    assertValidLoanStatusTransition(currentStatus, parsed.data.loan_status);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid status transition" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("loans")
    .update({ loan_status: parsed.data.loan_status, status: parsed.data.loan_status })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
