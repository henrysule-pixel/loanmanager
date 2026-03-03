import Link from "next/link";
import { notFound } from "next/navigation";
import { InvestorEditForm } from "@/components/investors/investor-edit-form";
import { PageHeader } from "@/components/page-header";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

export default async function EditInvestorPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from("investors").select("*").eq("id", params.id).single();
  const investor = data as Database["public"]["Tables"]["investors"]["Row"] | null;

  if (!investor) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${investor.full_name}`} description="Update client information and balances." />
      <InvestorEditForm investor={investor} />
      <Link href={`/dashboard/investors/${investor.id}`} className="inline-flex text-sm font-medium text-emerald-700 hover:underline">
        Back to Client Profile
      </Link>
    </div>
  );
}
