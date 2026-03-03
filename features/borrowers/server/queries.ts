import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

interface BorrowerQueryOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listBorrowers(options: BorrowerQueryOptions = {}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("borrowers")
    .select("id, full_name, phone_number, email, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (options.search) {
    query = query.or(
      `full_name.ilike.%${options.search}%,email.ilike.%${options.search}%,phone_number.ilike.%${options.search}%`,
    );
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(error.message);

  return {
    rows:
      (data as Pick<
        Database["public"]["Tables"]["borrowers"]["Row"],
        "id" | "full_name" | "phone_number" | "email" | "created_at"
      >[] | null) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  };
}
