"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateBorrowerAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/types/database";

type BorrowerRow = Database["public"]["Tables"]["borrowers"]["Row"];

export function BorrowerEditForm({ borrower }: { borrower: BorrowerRow }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 rounded-xl border bg-white p-4 shadow-soft md:grid-cols-2"
      action={(formData) =>
        startTransition(async () => {
          try {
            await updateBorrowerAction(formData);
            toast.success("Client information updated");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update client");
          }
        })
      }
    >
      <input type="hidden" name="id" value={borrower.id} />
      <div>
        <Label>First Name</Label>
        <Input name="first_name" defaultValue={borrower.first_name ?? borrower.full_name.split(" ")[0] ?? ""} required />
      </div>
      <div>
        <Label>Last Name</Label>
        <Input
          name="last_name"
          defaultValue={borrower.last_name ?? borrower.full_name.split(" ").slice(1).join(" ") ?? ""}
          required
        />
      </div>
      <div>
        <Label>Phone Number</Label>
        <Input name="phone_number" defaultValue={borrower.phone_number} required />
      </div>
      <div>
        <Label>Email</Label>
        <Input name="email" type="email" defaultValue={borrower.email} required />
      </div>
      <div>
        <Label>Contract Date</Label>
        <Input name="contract_date" type="date" defaultValue={borrower.contract_date ?? ""} />
      </div>
      <div>
        <Label>Date of Birth</Label>
        <Input name="date_of_birth" type="date" defaultValue={borrower.date_of_birth ?? ""} />
      </div>
      <div>
        <Label>Government ID</Label>
        <Input name="government_id_number" defaultValue={borrower.government_id_number} required />
      </div>
      <div>
        <Label>Lawyer Name</Label>
        <Input name="attorney_name" defaultValue={borrower.attorney_name ?? ""} />
      </div>
      <div>
        <Label>Lawyer Phone</Label>
        <Input name="attorney_phone" defaultValue={borrower.attorney_phone ?? ""} />
      </div>
      <div>
        <Label>Lawyer Email</Label>
        <Input name="attorney_email" type="email" defaultValue={borrower.attorney_email ?? ""} />
      </div>
      <div className="md:col-span-2">
        <Label>Address</Label>
        <Textarea name="address" defaultValue={borrower.address} required />
      </div>
      <div className="md:col-span-2">
        <Label>Note</Label>
        <Textarea name="notes" defaultValue={borrower.notes ?? ""} />
      </div>
      <div className="md:col-span-2">
        <Button disabled={isPending}>{isPending ? "Saving..." : "Save Changes"}</Button>
      </div>
    </form>
  );
}
