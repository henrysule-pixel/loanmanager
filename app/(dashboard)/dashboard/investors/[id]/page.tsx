import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { toCurrency } from "@/lib/utils";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

export default async function InvestorProfilePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const [{ data: investorData }, { data: transactionsData }] = await Promise.all([
    supabase.from("investors").select("*").eq("id", params.id).single(),
    supabase
      .from("investor_transactions")
      .select("id, amount, transaction_type, transaction_date, notes, loans(loan_id)")
      .eq("investor_id", params.id)
      .order("created_at", { ascending: false }),
  ]);
  const investor = investorData as Database["public"]["Tables"]["investors"]["Row"] | null;
  const transactions =
    (transactionsData as {
      id: string;
      amount: number;
      transaction_type: string;
      transaction_date: string;
      notes: string | null;
      loans: { loan_id?: string } | null;
    }[] | null) ?? [];

  if (!investor) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={investor.full_name} description="Investor profile and transaction history." />
      <Card>
        <CardHeader>
          <CardTitle>Investor Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <p><span className="font-medium">Email:</span> {investor.email}</p>
          <p><span className="font-medium">Phone:</span> {investor.phone}</p>
          <p><span className="font-medium">Status:</span> {investor.status}</p>
          <p><span className="font-medium">Capital Invested:</span> {toCurrency(Number(investor.total_capital_invested))}</p>
          <p><span className="font-medium">Available Balance:</span> {toCurrency(Number(investor.available_balance))}</p>
          <p><span className="font-medium">Returns Earned:</span> {toCurrency(Number(investor.total_returns_earned))}</p>
          <p className="md:col-span-2"><span className="font-medium">Investment Notes:</span> {investor.notes ?? "N/A"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Type</TH>
                  <TH>Amount</TH>
                  <TH>Loan</TH>
                  <TH>Date</TH>
                  <TH>Notes</TH>
                </TR>
              </THead>
              <TBody>
                {transactions.map((txn) => (
                  <TR key={txn.id}>
                    <TD>{txn.transaction_type}</TD>
                    <TD>{toCurrency(Number(txn.amount))}</TD>
                    <TD>{(txn.loans as { loan_id?: string } | null)?.loan_id ?? "N/A"}</TD>
                    <TD>{new Date(txn.transaction_date).toLocaleDateString()}</TD>
                    <TD>{txn.notes ?? "-"}</TD>
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
