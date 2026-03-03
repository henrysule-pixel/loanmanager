"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateInvestorAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/types/database";

type InvestorRow = Database["public"]["Tables"]["investors"]["Row"];

export function InvestorEditForm({ investor }: { investor: InvestorRow }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 rounded-xl border bg-white p-4 shadow-soft md:grid-cols-2"
      action={(formData) =>
        startTransition(async () => {
          try {
            await updateInvestorAction(formData);
            toast.success("Client information updated");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update client information");
          }
        })
      }
    >
      <input type="hidden" name="id" value={investor.id} />
      <div>
        <Label>Client Name</Label>
        <Input name="full_name" defaultValue={investor.full_name} required />
      </div>
      <div>
        <Label>Email</Label>
        <Input name="email" type="email" defaultValue={investor.email} required />
      </div>
      <div>
        <Label>Phone</Label>
        <Input name="phone" defaultValue={investor.phone} required />
      </div>
      <div>
        <Label>Address</Label>
        <Input name="address" defaultValue={investor.address} required />
      </div>
      <div>
        <Label>Total Invested</Label>
        <Input name="total_capital_invested" type="number" step="0.01" defaultValue={String(investor.total_capital_invested)} required />
      </div>
      <div>
        <Label>Available Balance</Label>
        <Input name="available_balance" type="number" step="0.01" defaultValue={String(investor.available_balance)} required />
      </div>
      <div>
        <Label>Total Returns Earned</Label>
        <Input name="total_returns_earned" type="number" step="0.01" defaultValue={String(investor.total_returns_earned)} required />
      </div>
      <div>
        <Label>Status</Label>
        <select name="status" defaultValue={investor.status} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <Label>Notes</Label>
        <Textarea name="notes" defaultValue={investor.notes ?? ""} placeholder="Update client notes" />
      </div>
      <div className="md:col-span-2">
        <Button disabled={isPending}>{isPending ? "Saving..." : "Save Changes"}</Button>
      </div>
    </form>
  );
}
