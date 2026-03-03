import { createSupabaseServerClient } from "@/supabase/server";

export async function getReportSummary() {
  const supabase = createSupabaseServerClient();
  const [{ count: borrowerCount }, { count: loanCount }, { count: investorCount }] = await Promise.all([
    supabase.from("borrowers").select("id", { count: "exact", head: true }),
    supabase.from("loans").select("id", { count: "exact", head: true }),
    supabase.from("investors").select("id", { count: "exact", head: true }),
  ]);

  return {
    borrowerCount: borrowerCount ?? 0,
    loanCount: loanCount ?? 0,
    investorCount: investorCount ?? 0,
  };
}
