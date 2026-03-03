import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { toCurrency } from "@/lib/utils";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

export default async function LoanDetailsPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const [{ data: loanData }, { data: paymentsData }, { data: allocationsData }] = await Promise.all([
    supabase
      .from("loans")
      .select("id, loan_id, principal_amount, interest_rate, start_date, maturity_date, loan_status, collateral_description, collateral_estimated_value, risk_rating, notes, borrowers(full_name)")
      .eq("id", params.id)
      .single(),
    supabase
      .from("loan_payments")
      .select("id, payment_amount, payment_type, payment_date, notes")
      .eq("loan_id", params.id)
      .order("payment_date", { ascending: false }),
    supabase
      .from("investor_transactions")
      .select("id, amount, transaction_type, transaction_date, investors(full_name)")
      .eq("loan_id", params.id)
      .order("transaction_date", { ascending: false }),
  ]);

  const loan = loanData as (Database["public"]["Tables"]["loans"]["Row"] & { borrowers?: { full_name?: string } | null }) | null;
  const payments =
    (paymentsData as Pick<
      Database["public"]["Tables"]["loan_payments"]["Row"],
      "id" | "payment_amount" | "payment_type" | "payment_date" | "notes"
    >[] | null) ?? [];
  const allocations =
    (allocationsData as {
      id: string;
      amount: number;
      transaction_type: Database["public"]["Enums"]["investor_transaction_type"];
      transaction_date: string;
      investors: { full_name?: string } | null;
    }[] | null) ?? [];

  if (!loan) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Loan ${loan.loan_id}`} description="Loan details, payment history, and investor allocations." />

      <Card>
        <CardHeader>
          <CardTitle>Loan Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <p><span className="font-medium">Borrower:</span> {loan.borrowers?.full_name ?? "N/A"}</p>
          <p><span className="font-medium">Status:</span> {loan.loan_status}</p>
          <p><span className="font-medium">Principal:</span> {toCurrency(Number(loan.principal_amount))}</p>
          <p><span className="font-medium">Interest Rate:</span> {Number(loan.interest_rate)}%</p>
          <p><span className="font-medium">Start Date:</span> {new Date(loan.start_date).toLocaleDateString()}</p>
          <p><span className="font-medium">Maturity Date:</span> {new Date(loan.maturity_date).toLocaleDateString()}</p>
          <p><span className="font-medium">Risk Rating:</span> {loan.risk_rating ?? "N/A"}</p>
          <p><span className="font-medium">Collateral Value:</span> {loan.collateral_estimated_value ? toCurrency(Number(loan.collateral_estimated_value)) : "N/A"}</p>
          <p className="md:col-span-2"><span className="font-medium">Collateral:</span> {loan.collateral_description ?? "N/A"}</p>
          <p className="md:col-span-2"><span className="font-medium">Notes:</span> {loan.notes ?? "N/A"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Type</TH>
                  <TH>Amount</TH>
                  <TH>Notes</TH>
                </TR>
              </THead>
              <TBody>
                {payments.map((payment) => (
                  <TR key={payment.id}>
                    <TD>{new Date(payment.payment_date).toLocaleDateString()}</TD>
                    <TD>{payment.payment_type}</TD>
                    <TD>{toCurrency(Number(payment.payment_amount))}</TD>
                    <TD>{payment.notes ?? "-"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Investor Allocations & Returns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Investor</TH>
                  <TH>Transaction Type</TH>
                  <TH>Amount</TH>
                </TR>
              </THead>
              <TBody>
                {allocations.map((txn) => (
                  <TR key={txn.id}>
                    <TD>{new Date(txn.transaction_date).toLocaleDateString()}</TD>
                    <TD>{txn.investors?.full_name ?? "N/A"}</TD>
                    <TD>{txn.transaction_type}</TD>
                    <TD>{toCurrency(Number(txn.amount))}</TD>
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
