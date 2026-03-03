"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createInvestorAction, createInvestorTransactionAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/types/database";

type Investor = Pick<Database["public"]["Tables"]["investors"]["Row"], "id" | "full_name">;
type Loan = Pick<Database["public"]["Tables"]["loans"]["Row"], "id" | "loan_id">;

export function InvestorForm({ investors, loans }: { investors: Investor[]; loans: Loan[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form
        className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft"
        action={(formData) =>
          startTransition(async () => {
            const firstName = String(formData.get("first_name") ?? "").trim();
            const lastName = String(formData.get("last_name") ?? "").trim();
            const fullName = `${firstName} ${lastName}`.trim();
            if (fullName) formData.set("full_name", fullName);
            if (!formData.get("available_balance")) {
              formData.set("available_balance", String(formData.get("total_capital_invested") ?? "0"));
            }
            if (!formData.get("address")) {
              const country = String(formData.get("country") ?? "").trim();
              const state = String(formData.get("state") ?? "").trim();
              formData.set("address", [state, country].filter(Boolean).join(", "));
            }
            if (!formData.get("status")) formData.set("status", "ACTIVE");
            if (!formData.get("total_returns")) formData.set("total_returns", "0");
            if (!formData.get("total_returns_earned")) formData.set("total_returns_earned", "0");
            try {
              await createInvestorAction(formData);
              toast.success("Investor created");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed to create investor");
            }
          })
        }
      >
        <h3 className="font-semibold">Create Investor</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>First Name</Label><Input name="first_name" required /></div>
          <div><Label>Last Name</Label><Input name="last_name" required /></div>
          <input type="hidden" name="full_name" value="" />
          <div><Label>Email</Label><Input name="email" type="email" required /></div>
          <div><Label>Phone Contact</Label><Input name="phone" required /></div>
          <div><Label>Investment Number</Label><Input name="investment_number" required /></div>
          <div><Label>Investment Date</Label><Input name="investment_date" type="date" required /></div>
          <div><Label>Investment Due Date</Label><Input name="investment_due_date" type="date" required /></div>
          <div><Label>Invested Amount</Label><Input name="total_capital_invested" type="number" step="0.01" required /></div>
          <div><Label>Interest Rate (%)</Label><Input name="interest_rate" type="number" step="0.01" required /></div>
          <div><Label>Interest Rate in Dollar</Label><Input name="interest_rate_dollar" type="number" step="0.01" required /></div>
          <div><Label>Country</Label><Input name="country" required /></div>
          <div><Label>State</Label><Input name="state" required /></div>
          <div><Label>Next of Kin</Label><Input name="next_of_kin_name" required /></div>
          <div><Label>Next Phone Number</Label><Input name="next_of_kin_phone" required /></div>
          <div><Label>Next of Kin Email</Label><Input name="next_of_kin_email" type="email" required /></div>
          <div>
            <Label>Upload Investor Document</Label>
            <Input name="investor_document" type="file" />
          </div>
          <div>
            <Label>Next of Kin Document</Label>
            <Input name="next_of_kin_document" type="file" />
          </div>
        </div>
        <input type="hidden" name="status" value="ACTIVE" />
        <input type="hidden" name="available_balance" value="" />
        <input type="hidden" name="total_returns" value="0" />
        <input type="hidden" name="total_returns_earned" value="0" />
        <input type="hidden" name="address" value="" />
        <Button disabled={isPending}>{isPending ? "Saving..." : "Save Investor"}</Button>
      </form>

      <form
        className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft"
        action={(formData) =>
          startTransition(async () => {
            try {
              await createInvestorTransactionAction(formData);
              toast.success("Transaction recorded");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed to save transaction");
            }
          })
        }
      >
        <h3 className="font-semibold">Investor Transaction</h3>
        <Label>Investor</Label>
        <select name="investor_id" className="h-10 rounded-md border px-3 text-sm">
          {investors.map((investor) => (
            <option key={investor.id} value={investor.id}>
              {investor.full_name}
            </option>
          ))}
        </select>
        <Label>Loan (optional for allocation/payment)</Label>
        <select name="loan_id" className="h-10 rounded-md border px-3 text-sm">
          <option value="">None</option>
          {loans.map((loan) => (
            <option key={loan.id} value={loan.id}>
              {loan.loan_id}
            </option>
          ))}
        </select>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Amount</Label><Input name="amount" type="number" step="0.01" required /></div>
          <div>
            <Label>Transaction Type</Label>
            <select name="transaction_type" className="h-10 w-full rounded-md border px-3 text-sm">
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="ALLOCATION">Loan Allocation</option>
              <option value="RETURN">Return Payment</option>
            </select>
          </div>
        </div>
        <div><Label>Date</Label><Input name="transaction_date" type="date" required /></div>
        <div><Label>Notes</Label><Textarea name="notes" /></div>
        <Button variant="outline" disabled={isPending}>
          Save Transaction
        </Button>
      </form>
    </div>
  );
}
