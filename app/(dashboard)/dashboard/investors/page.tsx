import Link from "next/link";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { TableQueryControls } from "@/components/data-table/table-query-controls";
import { InvestorForm } from "@/components/investors/investor-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { listInvestors } from "@/features/investors/server/queries";
import { toCurrency } from "@/lib/utils";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

export default async function InvestorsPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string };
}) {
  const supabase = createSupabaseServerClient();
  const page = Number(searchParams.page ?? "1");
  const search = searchParams.search ?? "";
  const [investorsResult, { data: loansData }] = await Promise.all([
    listInvestors({ search, page, pageSize: 10 }),
    supabase.from("loans").select("id, loan_id").order("created_at", { ascending: false }),
  ]);
  const investors = investorsResult.rows;
  const total = investorsResult.total;
  const pageSize = investorsResult.pageSize;
  const loans = (loansData as Pick<Database["public"]["Tables"]["loans"]["Row"], "id" | "loan_id">[] | null) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Investors" description="Capital, returns, and allocation tracking." />
      <TableQueryControls searchParam={search} searchPlaceholder="Search investors by name or email" />
      <InvestorForm investors={investors} loans={loans} />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Status</TH>
                  <TH>Total Invested</TH>
                  <TH>Available Balance</TH>
                  <TH>Action</TH>
                </TR>
              </THead>
              <TBody>
                {investors.map((investor) => (
                  <TR key={investor.id}>
                    <TD>
                      <Link
                        href={`/dashboard/investors/${investor.id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {investor.full_name}
                      </Link>
                    </TD>
                    <TD>{investor.email}</TD>
                    <TD>{investor.status}</TD>
                    <TD>{toCurrency(Number(investor.total_capital_invested))}</TD>
                    <TD>{toCurrency(Number(investor.available_balance))}</TD>
                    <TD>
                      <Link href={`/dashboard/investors/${investor.id}/edit`} className="font-medium text-emerald-700 hover:underline">
                        Edit
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        pathname="/dashboard/investors"
        searchParams={{ search }}
      />
    </div>
  );
}
