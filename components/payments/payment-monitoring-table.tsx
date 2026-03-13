"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createLoanMonitoringRowAction, updateLoanMonitoringAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { toCurrency } from "@/lib/utils";

interface PaymentMonitoringRow {
  id: string;
  loan_id: string;
  borrower_id: string;
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

interface BorrowerOption {
  id: string;
  full_name: string;
}

export function PaymentMonitoringTable({ rows, borrowers }: { rows: PaymentMonitoringRow[]; borrowers: BorrowerOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowResetToken, setRowResetToken] = useState<Record<string, number>>({});
  const [showCreateRow, setShowCreateRow] = useState(false);
  const [createRowResetToken, setCreateRowResetToken] = useState(0);

  const resetRow = (rowId: string) => {
    setEditingRowId(null);
    setRowResetToken((prev) => ({ ...prev, [rowId]: (prev[rowId] ?? 0) + 1 }));
  };
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-end border-b border-slate-200 p-3">
        <Button
          type="button"
          className="bg-[#132a55] text-white hover:bg-[#0f2143]"
          onClick={() => {
            setShowCreateRow(true);
            setEditingRowId(null);
          }}
        >
          Create New Row
        </Button>
      </div>
      <Table>
        <THead className="bg-[#0f1e3d] [&_th]:text-slate-200">
          <TR>
            <TH>Loan</TH>
            <TH>Borrower</TH>
            <TH>Principal</TH>
            <TH className="min-w-[200px]">Monthly Payment</TH>
            <TH>Contract Date</TH>
            <TH>Payment Due Date</TH>
            <TH className="min-w-[190px]">Means of Payment</TH>
            <TH className="min-w-[190px]">Unpaid Monthly Due</TH>
            <TH className="min-w-[180px]">Arrears ($)</TH>
            <TH>Expiration Date</TH>
            <TH className="min-w-[360px]">Note</TH>
            <TH />
          </TR>
        </THead>
        <TBody>
          {showCreateRow ? (
            <TR key={`create-row-${createRowResetToken}`} className="bg-amber-50/50">
              <TD>
                <Input
                  form="loan-monitoring-create"
                  name="loan_id"
                  type="text"
                  placeholder="Loan number"
                  className="min-w-[130px] border-slate-300 bg-white"
                  defaultValue=""
                  required
                />
              </TD>
              <TD>
                <select
                  form="loan-monitoring-create"
                  name="borrower_id"
                  defaultValue=""
                  className="h-10 min-w-[170px] rounded-md border border-slate-300 bg-white px-3 text-sm"
                  required
                >
                  <option value="">Select borrower</option>
                  {borrowers.map((borrower) => (
                    <option key={borrower.id} value={borrower.id}>
                      {borrower.full_name}
                    </option>
                  ))}
                </select>
              </TD>
              <TD>
                <Input
                  form="loan-monitoring-create"
                  name="principal_amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="$0.00"
                  className="min-w-[130px] border-slate-300 bg-white"
                  required
                />
              </TD>
              <TD className="min-w-[200px]">
                <Input
                  form="loan-monitoring-create"
                  name="monthly_payment"
                  type="text"
                  inputMode="decimal"
                  placeholder="$0.00"
                  className="min-w-[170px] border-slate-300 bg-white"
                />
              </TD>
              <TD>
                <Input
                  form="loan-monitoring-create"
                  name="contract_date"
                  type="date"
                  defaultValue={today}
                  className="border-slate-300 bg-white"
                  required
                />
              </TD>
              <TD>
                <Input
                  form="loan-monitoring-create"
                  name="payment_due_date"
                  type="date"
                  className="border-slate-300 bg-white"
                />
              </TD>
              <TD className="min-w-[190px]">
                <select
                  form="loan-monitoring-create"
                  name="means_of_payment"
                  defaultValue=""
                  className="h-10 w-full min-w-[165px] rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="">Select</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="INTERAC">Interac</option>
                </select>
              </TD>
              <TD className="min-w-[190px]">
                <Input
                  form="loan-monitoring-create"
                  name="unpaid_monthly_due"
                  type="number"
                  step="0.01"
                  className="min-w-[160px] border-slate-300 bg-white"
                />
              </TD>
              <TD className="min-w-[180px]">
                <Input
                  form="loan-monitoring-create"
                  name="arrears"
                  type="text"
                  inputMode="decimal"
                  placeholder="$0.00"
                  className="min-w-[160px] border-slate-300 bg-white"
                />
              </TD>
              <TD>
                <Input
                  form="loan-monitoring-create"
                  name="expiration_date"
                  type="date"
                  defaultValue={today}
                  className="border-slate-300 bg-white"
                  required
                />
              </TD>
              <TD className="min-w-[360px]">
                <Textarea
                  form="loan-monitoring-create"
                  name="note"
                  placeholder="Add opening note"
                  rows={3}
                  className="min-h-[90px] min-w-[320px] border-slate-300 bg-white"
                />
              </TD>
              <TD>
                <form
                  id="loan-monitoring-create"
                  action={(formData) =>
                    startTransition(async () => {
                      try {
                        await createLoanMonitoringRowAction(formData);
                        toast.success("New row created");
                        setShowCreateRow(false);
                        setCreateRowResetToken((prev) => prev + 1);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to create row");
                      }
                    })
                  }
                >
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isPending} className="bg-amber-500 text-white hover:bg-amber-600">
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        setShowCreateRow(false);
                        setCreateRowResetToken((prev) => prev + 1);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </TD>
            </TR>
          ) : null}
          {rows.length === 0 ? (
            <TR>
              <TD colSpan={12} className="py-6 text-center text-sm text-muted-foreground">
                No loans found for this view.
              </TD>
            </TR>
          ) : null}
          {rows.map((row) => {
            const isEditing = editingRowId === row.id;
            return (
            <TR
              key={`${row.id}-${rowResetToken[row.id] ?? 0}`}
              className={row.is_overdue ? "border-l-4 border-l-rose-500 bg-rose-50/40" : "hover:bg-[#f8fafc]"}
            >
              <TD className="font-semibold text-slate-800">{row.loan_id}</TD>
              <TD>
                {isEditing ? (
                  <select
                    form={`loan-monitoring-${row.id}`}
                    name="borrower_id"
                    defaultValue={row.borrower_id}
                    className="h-10 min-w-[170px] rounded-md border border-slate-300 bg-white px-3 text-sm"
                  >
                    {borrowers.map((borrower) => (
                      <option key={borrower.id} value={borrower.id}>
                        {borrower.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  row.borrower_name
                )}
              </TD>
              <TD>
                <Input
                  form={`loan-monitoring-${row.id}`}
                  name="principal_amount"
                  type="text"
                  inputMode="decimal"
                  defaultValue={row.principal_amount}
                  placeholder="$0.00"
                  className="min-w-[130px] border-slate-300 bg-white"
                  disabled={!isEditing}
                />
              </TD>
              <TD className="min-w-[200px]">
                <Input
                  form={`loan-monitoring-${row.id}`}
                  name="monthly_payment"
                  type="text"
                  inputMode="decimal"
                  defaultValue={row.monthly_payment ?? ""}
                  placeholder="$0.00"
                  className="min-w-[170px] border-slate-300 bg-white"
                  disabled={!isEditing}
                />
              </TD>
              <TD>
                <Input
                  form={`loan-monitoring-${row.id}`}
                  name="contract_date"
                  type="date"
                  defaultValue={row.contract_date ? row.contract_date.slice(0, 10) : ""}
                  className="border-slate-300 bg-white"
                  disabled={!isEditing}
                />
              </TD>
              <TD>
                <Input
                  form={`loan-monitoring-${row.id}`}
                  name="payment_due_date"
                  type="date"
                  defaultValue={row.payment_due_date ?? ""}
                  className="border-slate-300 bg-white"
                  disabled={!isEditing}
                />
              </TD>
              <TD className="min-w-[190px]">
                <select
                  form={`loan-monitoring-${row.id}`}
                  name="means_of_payment"
                  defaultValue={row.means_of_payment ?? ""}
                  className="h-10 w-full min-w-[165px] rounded-md border border-slate-300 bg-white px-3 text-sm"
                  disabled={!isEditing}
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
                  className="min-w-[160px] border-slate-300 bg-white"
                  disabled={!isEditing}
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
                    className="min-w-[160px] border-slate-300 bg-white"
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-slate-500">
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
                  className="border-slate-300 bg-white"
                />
              </TD>
              <TD className="min-w-[360px]">
                <Textarea
                  form={`loan-monitoring-${row.id}`}
                  name="note"
                  placeholder="Add follow-up note"
                  rows={4}
                  className="min-h-[110px] min-w-[320px] border-slate-300 bg-white"
                  disabled={!isEditing}
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
                        setEditingRowId(null);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to update loan monitoring");
                      }
                    })
                  }
                >
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isPending} className="bg-amber-500 text-white hover:bg-amber-600">
                        Save
                      </Button>
                      <Button type="button" variant="outline" disabled={isPending} onClick={() => resetRow(row.id)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" disabled={isPending} onClick={() => setEditingRowId(row.id)}>
                      Edit
                    </Button>
                  )}
                </form>
              </TD>
            </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
