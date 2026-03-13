import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { PaymentMonitoringTable } from "@/components/payments/payment-monitoring-table";
import { toCurrency } from "@/lib/utils";
import { createSupabaseServerClient } from "@/supabase/server";

interface PaymentsPageProps {
  searchParams?: {
    view?: string;
  };
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const supabase = createSupabaseServerClient();
  const filterView = searchParams?.view ?? "all";

  const withDueCols = await supabase
    .from("loans")
    .select(
      "id, loan_id, loan_status, principal_amount, monthly_payment, start_date, maturity_date, payment_due_date, unpaid_monthly_due, means_of_payment, arrears, borrowers(full_name)",
    )
    .order("created_at", { ascending: false });

  const data =
    withDueCols.error && /monthly_payment|payment_due_date|unpaid_monthly_due|means_of_payment|arrears/i.test(withDueCols.error.message)
      ? (
          await supabase
            .from("loans")
            .select("id, loan_id, loan_status, principal_amount, start_date, maturity_date, borrowers(full_name)")
            .order("created_at", { ascending: false })
        ).data
      : withDueCols.data;

  const rows =
    (data as
      | {
          id: string;
          loan_id: string;
          loan_status: string;
          principal_amount: number;
          monthly_payment?: number | null;
          start_date: string;
          maturity_date: string;
          payment_due_date?: string | null;
          unpaid_monthly_due?: number | null;
          means_of_payment?: string | null;
          arrears?: number | null;
          borrowers: { full_name?: string } | null;
        }[]
      | null
      | undefined
    )?.map((row) => ({
      id: row.id,
      loan_id: row.loan_id,
      borrower_name: row.borrowers?.full_name ?? "N/A",
      loan_status: row.loan_status,
      principal_amount: Number(row.principal_amount),
      monthly_payment: row.monthly_payment ?? null,
      contract_date: row.start_date,
      maturity_date: row.maturity_date,
      payment_due_date: row.payment_due_date ?? null,
      unpaid_monthly_due: row.unpaid_monthly_due ?? null,
      means_of_payment: row.means_of_payment ?? null,
      arrears: row.arrears ?? null,
      is_overdue: Boolean(
        row.payment_due_date &&
          row.unpaid_monthly_due &&
          Number(row.unpaid_monthly_due) > 0 &&
          new Date(row.payment_due_date) < new Date(new Date().toISOString().slice(0, 10)),
      ),
    })) ?? [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const filteredRows =
    filterView === "unpaid-month"
      ? rows.filter((row) => {
          if (Number(row.unpaid_monthly_due ?? 0) <= 0 || !row.payment_due_date) return false;
          const dueDate = new Date(row.payment_due_date);
          return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
        })
      : rows;
  const totalUnpaidMonthlyDue = filteredRows.reduce((sum, row) => sum + Number(row.unpaid_monthly_due ?? 0), 0);
  const overdueCount = filteredRows.filter((row) => row.is_overdue).length;
  const today = new Date(new Date().toISOString().slice(0, 10));
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 30);
  const expiringSoonCount = filteredRows.filter((row) => {
    const expiry = new Date(row.maturity_date);
    return expiry >= today && expiry <= soon;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments Monitoring"
        description="Daily staff workflow for payment due date tracking, unpaid monthly dues, expiration updates, and follow-up notes."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-slate-700">Total Unpaid Monthly Due</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-700">{toCurrency(totalUnpaidMonthlyDue)}</CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-slate-700">Overdue Loans</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-red-600">{overdueCount}</CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-slate-700">Expiring In 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-600">{expiringSoonCount}</CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Link href="/dashboard/payments">
          <span
            className={
              filterView === "all"
                ? "inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                : "inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            }
          >
            All Loans
          </span>
        </Link>
        <Link href="/dashboard/payments?view=unpaid-month">
          <span
            className={
              filterView === "unpaid-month"
                ? "inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                : "inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            }
          >
            Unpaid This Month
          </span>
        </Link>
      </div>

      <PaymentMonitoringTable rows={filteredRows} />
    </div>
  );
}
