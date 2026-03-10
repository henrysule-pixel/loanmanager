import Link from "next/link";
import { notFound } from "next/navigation";
import { BorrowerEditForm } from "@/components/borrowers/borrower-edit-form";
import { PageHeader } from "@/components/page-header";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

export default async function EditBorrowerPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from("borrowers").select("*").eq("id", params.id).single();
  const borrower = data as Database["public"]["Tables"]["borrowers"]["Row"] | null;

  if (!borrower) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${borrower.full_name}`} description="Update client information to reflect new changes." />
      <BorrowerEditForm borrower={borrower} />
      <Link href={`/dashboard/borrowers/${borrower.id}`} className="inline-flex text-sm font-medium text-emerald-700 hover:underline">
        Back to Client Profile
      </Link>
    </div>
  );
}
