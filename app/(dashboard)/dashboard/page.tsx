import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ActiveClosedLine,
  LoanStatusPie,
  MonthlyFundingBar,
  PipelineBar,
} from "@/charts/dashboard-charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDashboardAnalytics } from "@/lib/analytics/queries";
import { toCurrency } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const from = searchParams.from ?? "";
  const to = searchParams.to ?? "";
  const analytics = await getDashboardAnalytics({ from, to });

  return (
    <div>
      <PageHeader
        title="Portfolio Dashboard"
        description="Operational summary for borrowers, loans, and investors."
      />
      <form className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-soft md:flex-row md:items-end">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">From</p>
          <Input type="date" name="from" defaultValue={from} />
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">To</p>
          <Input type="date" name="to" defaultValue={to} />
        </div>
        <Button type="submit">Apply date range</Button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Total Active Loans</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-[#132a55]">{analytics.kpis.totalActiveLoans}</CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Total Loan Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-[#132a55]">
            {toCurrency(analytics.kpis.totalLoanPortfolioValue)}
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Total Investor Capital</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-[#132a55]">
            {toCurrency(analytics.kpis.totalInvestorCapital)}
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Late Loans Count</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-600">{analytics.kpis.lateLoansCount}</CardContent>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <LoanStatusPie data={analytics.loanStatusData} />
        <MonthlyFundingBar data={analytics.monthlyFundingData} />
        <PipelineBar data={analytics.pipelineData} />
        <ActiveClosedLine data={analytics.trendData} />
      </div>
    </div>
  );
}
