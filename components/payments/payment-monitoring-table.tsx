"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateLoanMonitoringAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { toCurrency } from "@/lib/utils";

interface PaymentMonitoringRow {
  id: string;
  loan_id: string;
  borrower_name: string;
  loan_status: string;
  principal_amount: number;
  monthly_payment: number | null;
  contract_date: string;
  maturity_date: string;
  payment_due_date: string | null;
  unpaid_monthly_due: number | null;
  means_of_payment: string | null;
  arrears: number | null;
  is_overdue: boolean;
}

export function PaymentMonitoringTable({ rows }: { rows: PaymentMonitoringRow[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-soft">
      <Table>
        <THead className="bg-gradient-to-r from-emerald-50 via-cyan-50 to-orange-50">
          <TR>
            <TH className="text-emerald-700">Loan</TH>
            <TH className="text-emerald-700">Borrower</TH>
            <TH className="text-emerald-700">Principal</TH>
            <TH className="min-w-[200px] text-teal-700">Monthly Payment</TH>
            <TH className="text-cyan-700">Contract Date</TH>
            <TH className="text-amber-700">Payment Due Date</TH>
            <TH className="min-w-[190px] text-sky-700">Means of Payment</TH>
            <TH className="min-w-[190px] text-indigo-700">Unpaid Monthly Due</TH>
            <TH className="min-w-[180px] text-orange-700">Arrears ($)</TH>
            <TH className="text-violet-700">Expiration Date</TH>
            <TH className="min-w-[360px] text-fuchsia-700">Note</TH>
            <TH />
          </TR>
        </THead>
        <TBody>
          {rows.map((row) => (
            <TR key={row.id} className={row.is_overdue ? "bg-red-50/70" : undefined}>
              <TD className="font-medium">{row.loan_id}</TD>
              <TD>{row.borrower_name}</TD>
              <TD>{toCurrency(Number(row.principal_amount))}</TD>
              <TD className="min-w-[200px]">
                <Input
                  form={`loan-monitoring-${row.id}`}
                  name="monthly_payment"
                  type="text"
                  inputMode="decimal"
                  defaultValue={row.monthly_payment ?? ""}
                  placeholder="$0.00"
                  className="min-w-[170px] border-teal-200 bg-teal-50/60"
                />
              </TD>
              <TD>
                <Input
                  form={`loan-monitoring-${row.id}`}
                  name="contract_date"
                  type="date"
                  defaultValue={row.contract_date ? row.contract_date.slice(0, 10) : ""}
                  className="border-cyan-200 bg-cyan-50/60"
                />
              </TD>
              <TD>
                <Input
                  form={`loan-monitoring-${row.id}`}
                  name="payment_due_date"
                  type="date"
                  defaultValue={row.payment_due_date ?? ""}
                  className="border-amber-200 bg-amber-50/60"
                />
              </TD>
              <TD className="min-w-[190px]">
                <select
                  form={`loan-monitoring-${row.id}`}
                  name="means_of_payment"
                  defaultValue={row.means_of_payment ?? ""}
                  className="h-10 w-full min-w-[165px] rounded-md border border-sky-200 bg-sky-50/60 px-3 text-sm"
                >
                  <option value="">Select</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="INTERAC">Interac</option>
                </select>
              </TD>
              <TD className="min-w-[190px]">
                <Input
                  form={`loan-monitoring-${row.id}`}
                  name="unpaid_monthly_due"
                  type="number"
                  step="0.01"
                  defaultValue={row.unpaid_monthly_due ?? ""}
                  className="min-w-[160px] border-indigo-200 bg-indigo-50/60"
                />
              </TD>
              <TD className="min-w-[180px]">
                <div className="space-y-1">
                  <Input
                    form={`loan-monitoring-${row.id}`}
                    name="arrears"
                    type="text"
                    inputMode="decimal"
                    defaultValue={row.arrears ?? ""}
                    placeholder="$0.00"
                    className="min-w-[160px] border-orange-200 bg-orange-50 focus-visible:ring-orange-300"
                  />
                  <p className="text-xs text-muted-foreground">
                    Current: {row.arrears !== null ? toCurrency(Number(row.arrears)) : "N/A"}
                  </p>
                </div>
              </TD>
              <TD>
                <Input
                  form={`loan-monitoring-${row.id}`}
                  name="expiration_date"
                  type="date"
                  defaultValue={row.maturity_date ? row.maturity_date.slice(0, 10) : ""}
                  className="border-violet-200 bg-violet-50/60"
                />
              </TD>
              <TD className="min-w-[360px]">
                <Textarea
                  form={`loan-monitoring-${row.id}`}
                  name="note"
                  placeholder="Add detailed note (supports long entries, 500+ words)"
                  rows={8}
                  className="min-h-[180px] min-w-[320px] border-fuchsia-200 bg-fuchsia-50/50"
                />
              </TD>
              <TD>
                <form
                  id={`loan-monitoring-${row.id}`}
                  action={(formData) =>
                    startTransition(async () => {
                      formData.set("loan_id", row.id);
                      try {
                        await updateLoanMonitoringAction(formData);
                        toast.success(`Updated ${row.loan_id}`);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to update loan monitoring");
                      }
                    })
                  }
                >
                  <Button disabled={isPending}>Save</Button>
                </form>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
