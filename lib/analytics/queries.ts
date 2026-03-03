import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

export interface DashboardAnalytics {
  kpis: {
    totalActiveLoans: number;
    totalLoanPortfolioValue: number;
    totalInvestorCapital: number;
    lateLoansCount: number;
  };
  loanStatusData: Array<{ name: string; value: number }>;
  monthlyFundingData: Array<{ name: string; value: number }>;
  pipelineData: Array<{ name: string; value: number }>;
  trendData: Array<{ month: string; active: number; closed: number }>;
}

interface DateRangeParams {
  from?: string;
  to?: string;
}

function toDateOrNull(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getDashboardAnalytics(params: DateRangeParams = {}): Promise<DashboardAnalytics> {
  const supabase = createSupabaseServerClient();
  let loansQuery = supabase.from("loans").select("id, principal_amount, loan_status, status, created_at");
  const fromDate = toDateOrNull(params.from);
  const toDate = toDateOrNull(params.to);
  if (fromDate) loansQuery = loansQuery.gte("created_at", fromDate.toISOString());
  if (toDate) loansQuery = loansQuery.lte("created_at", toDate.toISOString());

  const [{ data: loansData }, { data: investorsData }] = await Promise.all([loansQuery, supabase.from("investors").select("id, total_capital_invested")]);

  const loanRows =
    (loansData as Pick<
      Database["public"]["Tables"]["loans"]["Row"],
      "id" | "principal_amount" | "loan_status" | "status" | "created_at"
    >[] | null) ?? [];
  const investorRows =
    (investorsData as Pick<
      Database["public"]["Tables"]["investors"]["Row"],
      "id" | "total_capital_invested"
    >[] | null) ?? [];

  const normalizedStatus = (loan: Pick<Database["public"]["Tables"]["loans"]["Row"], "loan_status" | "status">) =>
    loan.status ?? loan.loan_status;

  const totalActiveLoans = loanRows.filter((loan) => normalizedStatus(loan) === "ACTIVE").length;
  const totalLoanPortfolioValue = loanRows.reduce((sum, loan) => sum + Number(loan.principal_amount), 0);
  const totalInvestorCapital = investorRows.reduce((sum, investor) => sum + Number(investor.total_capital_invested), 0);
  const lateLoansCount = loanRows.filter((loan) => {
    const status = normalizedStatus(loan);
    return status === "LATE" || status === "DEFAULTED";
  }).length;

  const statusCounts = loanRows.reduce<Record<string, number>>((acc, loan) => {
    const status = normalizedStatus(loan);
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  const loanStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const monthlyFunding = loanRows.reduce<Record<string, number>>((acc, loan) => {
    const month = new Date(loan.created_at).toLocaleString("en-US", { month: "short" });
    acc[month] = (acc[month] ?? 0) + Number(loan.principal_amount);
    return acc;
  }, {});
  const monthlyFundingData = Object.entries(monthlyFunding).map(([name, value]) => ({ name, value }));

  const loanStatusOrder: Database["public"]["Enums"]["loan_status"][] = [
    "APPLICATION",
    "UNDER_REVIEW",
    "APPROVED",
    "FUNDED",
    "ACTIVE",
    "LATE",
    "DEFAULTED",
    "CLOSED",
  ];
  const pipelineData = loanStatusOrder.map((name) => ({ name, value: statusCounts[name] ?? 0 }));

  const monthlyTrend = loanRows.reduce<Record<string, { month: string; active: number; closed: number }>>((acc, loan) => {
    const month = new Date(loan.created_at).toLocaleString("en-US", { month: "short" });
    if (!acc[month]) {
      acc[month] = { month, active: 0, closed: 0 };
    }
    const status = normalizedStatus(loan);
    if (status === "ACTIVE") acc[month].active += 1;
    if (status === "CLOSED") acc[month].closed += 1;
    return acc;
  }, {});
  const trendData = Object.values(monthlyTrend);

  return {
    kpis: { totalActiveLoans, totalLoanPortfolioValue, totalInvestorCapital, lateLoansCount },
    loanStatusData,
    monthlyFundingData,
    pipelineData,
    trendData,
  };
}
