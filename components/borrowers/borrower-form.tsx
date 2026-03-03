"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createBorrowerAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BorrowerForm() {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft"
      action={(formData) =>
        startTransition(async () => {
          const firstName = String(formData.get("first_name") ?? "").trim();
          const lastName = String(formData.get("last_name") ?? "").trim();
          const fullName = `${firstName} ${lastName}`.trim();
          if (fullName) {
            formData.set("full_name", fullName);
          }
          if (!formData.get("government_id_number")) {
            formData.set("government_id_number", String(formData.get("government_id") ?? ""));
          }
          if (!formData.get("phone")) {
            formData.set("phone", String(formData.get("phone_number") ?? ""));
          }
          if (!formData.get("attorney_name")) {
            formData.set("attorney_name", String(formData.get("lawyer_name") ?? ""));
          }
          if (!formData.get("address")) {
            formData.set("address", String(formData.get("client_address") ?? ""));
          }
          try {
            await createBorrowerAction(formData);
            toast.success("Borrower and loan intake saved");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save intake");
          }
        })
      }
    >
      <h3 className="font-semibold">Borrower Loan Intake Form</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div><Label>Loan Number</Label><Input name="loan_number" required /></div>
        <div><Label>Contract Date</Label><Input name="contract_date" type="date" required /></div>
        <div><Label>First Name</Label><Input name="first_name" required /></div>
        <div><Label>Last Name</Label><Input name="last_name" required /></div>
        <input type="hidden" name="full_name" value="" />
        <div><Label>Phone Number</Label><Input name="phone_number" required /></div>
        <input type="hidden" name="phone" value="" />
        <div><Label>Email</Label><Input name="email" type="email" required /></div>
        <div><Label>Date of Birth</Label><Input name="date_of_birth" type="date" /></div>
        <div><Label>Amount Borrowed</Label><Input name="amount_borrowed" type="number" step="0.01" required /></div>
        <div><Label>Current Balance</Label><Input name="current_balance" type="number" step="0.01" required /></div>
        <div><Label>Rate (%)</Label><Input name="rate" type="number" step="0.01" required /></div>
        <div><Label>Amount in Dollars</Label><Input name="amount_in_dollars" type="number" step="0.01" required /></div>
        <div><Label>Expiration Date</Label><Input name="expiration_date" type="date" required /></div>
        <div><Label>Amount Balance to Refund</Label><Input name="amount_balance_to_refund" type="number" step="0.01" required /></div>
        <div><Label>Government ID</Label><Input name="government_id" required /></div>
        <input type="hidden" name="government_id_number" value="" />
        <div><Label>Lawyer Name</Label><Input name="lawyer_name" required /></div>
        <input type="hidden" name="attorney_name" value="" />
        <div><Label>Lawyer Phone Number</Label><Input name="attorney_phone" required /></div>
        <div><Label>Lawyer Email</Label><Input name="attorney_email" type="email" required /></div>
      </div>
      <div><Label>Client Address</Label><Textarea name="client_address" required /></div>
      <input type="hidden" name="address" value="" />
      <div><Label>Notes</Label><Textarea name="notes" /></div>
      <div>
        <Label>Supporting Document</Label>
        <Input name="supporting_document" type="file" />
      </div>
      <Button disabled={isPending}>{isPending ? "Saving..." : "Save Intake Record"}</Button>
    </form>
  );
}
