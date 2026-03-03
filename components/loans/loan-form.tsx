"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createLoanAction, createLoanPaymentAction, updateLoanStatusAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/types/database";

type Borrower = Pick<Database["public"]["Tables"]["borrowers"]["Row"], "id" | "full_name">;
type Loan = Pick<Database["public"]["Tables"]["loans"]["Row"], "id" | "loan_id" | "loan_status">;

export function LoanForm({ borrowers, loans }: { borrowers: Borrower[]; loans: Loan[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form
        className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft"
        action={(formData) =>
          startTransition(async () => {
            try {
              await createLoanAction(formData);
              toast.success("Loan created");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed to create loan");
            }
          })
        }
      >
        <h3 className="font-semibold">Create Loan</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Loan ID</Label><Input name="loan_id" required /></div>
          <div>
            <Label>Borrower</Label>
            <select name="borrower_id" required className="h-10 w-full rounded-md border px-3 text-sm">
              {borrowers.map((borrower) => (
                <option key={borrower.id} value={borrower.id}>
                  {borrower.full_name}
                </option>
              ))}
            </select>
          </div>
          <div><Label>Principal</Label><Input name="principal_amount" type="number" step="0.01" required /></div>
          <div><Label>Interest Rate (%)</Label><Input name="interest_rate" type="number" step="0.01" required /></div>
          <div><Label>Start Date</Label><Input name="start_date" type="date" required /></div>
          <div><Label>Maturity Date</Label><Input name="maturity_date" type="date" required /></div>
          <div>
            <Label>Status</Label>
            <select name="loan_status" className="h-10 w-full rounded-md border px-3 text-sm">
              {["APPLICATION", "UNDER_REVIEW", "APPROVED", "FUNDED", "ACTIVE", "LATE", "DEFAULTED", "CLOSED"].map(
                (status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ),
              )}
            </select>
          </div>
          <div><Label>Risk Rating</Label><Input name="risk_rating" placeholder="Low / Medium / High" /></div>
        </div>
        <div><Label>Collateral Description</Label><Textarea name="collateral_description" /></div>
        <div><Label>Notes</Label><Textarea name="notes" /></div>
        <Button disabled={isPending}>{isPending ? "Saving..." : "Save Loan"}</Button>
      </form>

      <div className="grid gap-4">
        <form
          className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft"
          action={(formData) =>
            startTransition(async () => {
              try {
                await updateLoanStatusAction(formData);
                toast.success("Loan status updated");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to update status");
              }
            })
          }
        >
          <h3 className="font-semibold">Update Loan Status</h3>
          <Label>Loan</Label>
          <select name="loan_id" className="h-10 rounded-md border px-3 text-sm">
            {loans.map((loan) => (
              <option key={loan.id} value={loan.id}>
                {loan.loan_id} ({loan.loan_status})
              </option>
            ))}
          </select>
          <Label>New Status</Label>
          <select name="loan_status" className="h-10 rounded-md border px-3 text-sm">
            {["APPLICATION", "UNDER_REVIEW", "APPROVED", "FUNDED", "ACTIVE", "LATE", "DEFAULTED", "CLOSED"].map(
              (status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ),
            )}
          </select>
          <Button variant="outline" disabled={isPending}>
            Update Status
          </Button>
        </form>

        <form
          className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft"
          action={(formData) =>
            startTransition(async () => {
              try {
                await createLoanPaymentAction(formData);
                toast.success("Payment recorded");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to record payment");
              }
            })
          }
        >
          <h3 className="font-semibold">Record Loan Payment</h3>
          <Label>Loan</Label>
          <select name="loan_id" className="h-10 rounded-md border px-3 text-sm">
            {loans.map((loan) => (
              <option key={loan.id} value={loan.id}>
                {loan.loan_id}
              </option>
            ))}
          </select>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Amount</Label><Input name="payment_amount" type="number" step="0.01" required /></div>
            <div>
              <Label>Type</Label>
              <select name="payment_type" className="h-10 w-full rounded-md border px-3 text-sm">
                <option value="INTEREST">Interest</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="PENALTY">Penalty</option>
              </select>
            </div>
          </div>
          <div><Label>Payment Date</Label><Input name="payment_date" type="date" required /></div>
          <div><Label>Notes</Label><Textarea name="notes" /></div>
          <Button variant="outline" disabled={isPending}>
            Save Payment
          </Button>
        </form>
      </div>
    </div>
  );
}
