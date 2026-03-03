import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

interface LoanQueryOptions {
  search?: string;
  status?: Database["public"]["Enums"]["loan_status"] | "ALL";
  page?: number;
  pageSize?: number;
}

export async function listLoans(options: LoanQueryOptions = {}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = createSupabaseServerClient();

  let query = supabase
    .from("loans")
    .select("id, loan_id, principal_amount, loan_status, start_date, maturity_date, borrowers(full_name)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (options.search) {
    query = query.or(`loan_id.ilike.%${options.search}%`);
  }
  if (options.status && options.status !== "ALL") {
    query = query.eq("loan_status", options.status);
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(error.message);

  return {
    rows:
      (data as {
        id: string;
        loan_id: string;
        principal_amount: number;
        loan_status: Database["public"]["Enums"]["loan_status"];
        start_date: string;
        maturity_date: string;
        borrowers: { full_name?: string } | null;
      }[] | null) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  };
}
