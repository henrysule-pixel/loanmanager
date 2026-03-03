import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

type InvestorTransactionType = Database["public"]["Enums"]["investor_transaction_type"];

function normalizeType(type: InvestorTransactionType) {
  if (type === "LOAN_ALLOCATION") return "ALLOCATION";
  if (type === "RETURN_PAYMENT") return "RETURN";
  return type;
}

export async function recomputeInvestorBalances(investorId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("investor_transactions")
    .select("amount, transaction_type")
    .eq("investor_id", investorId);
  if (error) throw new Error(error.message);

  const rows =
    (data as Pick<
      Database["public"]["Tables"]["investor_transactions"]["Row"],
      "amount" | "transaction_type"
    >[] | null) ?? [];

  const totals = rows.reduce(
    (acc, row) => {
      const type = normalizeType(row.transaction_type);
      const amount = Number(row.amount);
      if (type === "DEPOSIT") acc.deposits += amount;
      if (type === "WITHDRAWAL") acc.withdrawals += amount;
      if (type === "ALLOCATION") acc.allocations += amount;
      if (type === "RETURN") acc.returns += amount;
      return acc;
    },
    { deposits: 0, withdrawals: 0, allocations: 0, returns: 0 },
  );

  const totalCapitalInvested = totals.deposits - totals.withdrawals;
  const availableBalance = totalCapitalInvested - totals.allocations + totals.returns;
  const totalReturns = totals.returns;

  const { error: updateError } = await supabase
    .from("investors")
    .update({
      total_capital_invested: totalCapitalInvested,
      available_balance: availableBalance,
      total_returns: totalReturns,
      total_returns_earned: totalReturns,
    })
    .eq("id", investorId);
  if (updateError) throw new Error(updateError.message);
}
