import Link from "next/link";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { TableQueryControls } from "@/components/data-table/table-query-controls";
import { LoanForm } from "@/components/loans/loan-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { listLoans } from "@/features/loans/server/queries";
import { toCurrency } from "@/lib/utils";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

export default async function LoansPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: Database["public"]["Enums"]["loan_status"] | "ALL"; page?: string };
}) {
  const supabase = createSupabaseServerClient();
  const page = Number(searchParams.page ?? "1");
  const search = searchParams.search ?? "";
  const status = searchParams.status ?? "ALL";

  const [{ data: borrowersData }, loansListResult, { data: paymentsData }] = await Promise.all([
    supabase.from("borrowers").select("id, full_name").order("full_name"),
    listLoans({ search, status, page, pageSize: 10 }),
    supabase
      .from("loan_payments")
      .select("id, payment_amount, payment_type, payment_date, loans(id, loan_id)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const borrowers = (borrowersData as { id: string; full_name: string }[] | null) ?? [];
  const loans = loansListResult.rows;
  const total = loansListResult.total;
  const pageSize = loansListResult.pageSize;
  const payments =
    (paymentsData as {
      id: string;
      payment_amount: number;
      payment_type: Database["public"]["Enums"]["payment_type"];
      payment_date: string;
      loans: { id?: string; loan_id?: string } | null;
    }[] | null) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Loans" description="Loan lifecycle, payments, and risk tracking." />
      <TableQueryControls
        searchParam={search}
        searchPlaceholder="Search loans by loan ID"
        statusParam={status}
        statusOptions={["APPLICATION", "UNDER_REVIEW", "APPROVED", "FUNDED", "ACTIVE", "LATE", "DEFAULTED", "CLOSED"]}
      />
      <LoanForm borrowers={borrowers} loans={loans.map((l) => ({ id: l.id, loan_id: l.loan_id, loan_status: l.loan_status }))} />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Loan ID</TH>
                  <TH>Borrower</TH>
                  <TH>Status</TH>
                  <TH>Principal</TH>
                  <TH>Maturity</TH>
                </TR>
              </THead>
              <TBody>
                {loans.map((loan) => (
                  <TR key={loan.id}>
                    <TD className="font-medium">
                      <Link href={`/dashboard/loans/${loan.id}`} className="text-emerald-700 hover:underline">
                        {loan.loan_id}
                      </Link>
                    </TD>
                    <TD>{(loan.borrowers as { full_name?: string } | null)?.full_name ?? "N/A"}</TD>
                    <TD>{loan.loan_status}</TD>
                    <TD>{toCurrency(Number(loan.principal_amount))}</TD>
                    <TD>{new Date(loan.maturity_date).toLocaleDateString()}</TD>
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
        pathname="/dashboard/loans"
        searchParams={{ search, status }}
      />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Loan</TH>
                  <TH>Amount</TH>
                  <TH>Type</TH>
                  <TH>Date</TH>
                </TR>
              </THead>
              <TBody>
                {payments.map((payment) => (
                  <TR key={payment.id}>
                    <TD>
                      {payment.loans?.id ? (
                        <Link href={`/dashboard/loans/${payment.loans.id}`} className="text-emerald-700 hover:underline">
                          {payment.loans.loan_id ?? "N/A"}
                        </Link>
                      ) : (
                        "N/A"
                      )}
                    </TD>
                    <TD>{toCurrency(Number(payment.payment_amount))}</TD>
                    <TD>{payment.payment_type}</TD>
                    <TD>{new Date(payment.payment_date).toLocaleDateString()}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
