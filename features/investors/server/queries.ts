import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

interface InvestorQueryOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listInvestors(options: InvestorQueryOptions = {}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = createSupabaseServerClient();

  let query = supabase
    .from("investors")
    .select("id, full_name, email, status, total_capital_invested, available_balance", { count: "exact" })
    .order("created_at", { ascending: false });

  if (options.search) {
    query = query.or(`full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(error.message);

  return {
    rows:
      (data as Pick<
        Database["public"]["Tables"]["investors"]["Row"],
        "id" | "full_name" | "email" | "status" | "total_capital_invested" | "available_balance"
      >[] | null) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  };
}
