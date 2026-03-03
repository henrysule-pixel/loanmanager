import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { toCurrency } from "@/lib/utils";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

function parseIntakeRecord(text: string | null | undefined) {
  if (!text) return new Map<string, string>();
  const normalized = text.replace(/INTAKE RECORD/gi, "\nINTAKE RECORD\n");
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const map = new Map<string, string>();
  for (const line of lines) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) map.set(key, value || "N/A");
  }
  return map;
}

export default async function BorrowerProfilePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const [{ data: borrowerData }, { data: loansData }] = await Promise.all([
    supabase.from("borrowers").select("*").eq("id", params.id).single(),
    supabase
      .from("loans")
      .select(
        "id, loan_id, principal_amount, loan_status, interest_rate, maturity_date, amount_balance_to_refund, collateral_estimated_value, start_date, payment_due_date, unpaid_monthly_due, means_of_payment, arrears",
      )
      .eq("borrower_id", params.id),
  ]);
  const borrower = borrowerData as Database["public"]["Tables"]["borrowers"]["Row"] | null;
  const loans =
    (loansData as Pick<
      Database["public"]["Tables"]["loans"]["Row"],
      | "id"
      | "loan_id"
      | "principal_amount"
      | "loan_status"
      | "interest_rate"
      | "maturity_date"
      | "amount_balance_to_refund"
      | "collateral_estimated_value"
      | "start_date"
      | "payment_due_date"
      | "unpaid_monthly_due"
      | "means_of_payment"
      | "arrears"
    >[] | null) ?? [];
  const supportingDocumentUrl = borrower?.supporting_document_url ?? borrower?.notes?.match(/https?:\/\/[^\s]+/)?.[0] ?? null;
  const intakeRecordText = borrower?.intake_record ?? borrower?.notes ?? "N/A";
  const intakeRecord = parseIntakeRecord(intakeRecordText);
  const getIntakeValue = (label: string, fallback = "N/A") => intakeRecord.get(label) ?? fallback;
  const intakeDocumentUrl = getIntakeValue("Supporting Document URL", supportingDocumentUrl ?? "N/A");

  if (!borrower) notFound();

  const loanIds = loans.map((loan) => loan.id);
  const { data: paymentsData } =
    loanIds.length > 0
      ? await supabase
          .from("loan_payments")
          .select("id, loan_id, payment_amount, payment_type, payment_date, notes")
          .in("loan_id", loanIds)
          .order("payment_date", { ascending: false })
      : { data: [] };
  const payments =
    (paymentsData as Pick<
      Database["public"]["Tables"]["loan_payments"]["Row"],
      "id" | "loan_id" | "payment_amount" | "payment_type" | "payment_date" | "notes"
    >[] | null) ?? [];
  const loanIdByDbId = new Map(loans.map((loan) => [loan.id, loan.loan_id]));

  return (
    <div className="space-y-6">
      <PageHeader title={borrower.full_name} description="Complete client profile, loan records, and payment history." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-200 bg-white md:col-span-2">
          <CardHeader className="border-b border-emerald-100 bg-emerald-50/70">
            <CardTitle className="text-emerald-800">Client Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p><span className="font-medium">Phone:</span> {borrower.phone_number}</p>
            <p><span className="font-medium">Email:</span> {borrower.email}</p>
            <p><span className="font-medium">Address:</span> {borrower.address}</p>
            <p><span className="font-medium">Contract Date:</span> {borrower.contract_date ? new Date(borrower.contract_date).toLocaleDateString() : "N/A"}</p>
            <p><span className="font-medium">Government ID:</span> {borrower.government_id_number}</p>
            <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-3 md:col-span-2">
              <p className="mb-3 font-medium text-emerald-800">Intake Record</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-emerald-200 bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Client Intake</p>
                  <p><span className="font-medium">Loan Number:</span> {getIntakeValue("Loan Number")}</p>
                  <p><span className="font-medium">First Name:</span> {getIntakeValue("First Name")}</p>
                  <p><span className="font-medium">Last Name:</span> {getIntakeValue("Last Name")}</p>
                  <p><span className="font-medium">Date of Birth:</span> {getIntakeValue("Date of Birth")}</p>
                  <p><span className="font-medium">Client Address:</span> {getIntakeValue("Client Address", borrower.address)}</p>
                </div>
                <div className="rounded-md border border-emerald-200 bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Loan Terms</p>
                  <p><span className="font-medium">Amount Borrowed:</span> {getIntakeValue("Amount Borrowed")}</p>
                  <p><span className="font-medium">Current Balance:</span> {getIntakeValue("Current Balance")}</p>
                  <p><span className="font-medium">Rate (%):</span> {getIntakeValue("Rate (%)")}</p>
                  <p><span className="font-medium">Amount in Dollars:</span> {getIntakeValue("Amount in Dollars")}</p>
                  <p><span className="font-medium">Amount to Refund:</span> {getIntakeValue("Amount Balance to Refund")}</p>
                  <p><span className="font-medium">Expiration Date:</span> {getIntakeValue("Expiration Date")}</p>
                </div>
                <div className="rounded-md border border-emerald-200 bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Legal Contacts</p>
                  <p><span className="font-medium">Lawyer Name:</span> {getIntakeValue("Lawyer Name", borrower.attorney_name ?? "N/A")}</p>
                  <p><span className="font-medium">Lawyer Phone:</span> {getIntakeValue("Lawyer Phone", borrower.attorney_phone ?? "N/A")}</p>
                  <p><span className="font-medium">Lawyer Email:</span> {getIntakeValue("Lawyer Email", borrower.attorney_email ?? "N/A")}</p>
                  <p><span className="font-medium">Witness Name:</span> {getIntakeValue("Witness Name", borrower.witness_full_name ?? "N/A")}</p>
                  <p><span className="font-medium">Witness Phone:</span> {getIntakeValue("Witness Phone", borrower.witness_phone ?? "N/A")}</p>
                </div>
                <div className="rounded-md border border-emerald-200 bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Documentation</p>
                  <p><span className="font-medium">Document Name:</span> {getIntakeValue("Supporting Document Name")}</p>
                  <p><span className="font-medium">Document URL:</span> {intakeDocumentUrl}</p>
                  <p className="mt-2 whitespace-pre-wrap"><span className="font-medium">Note:</span> {getIntakeValue("Note", borrower.notes ?? "N/A")}</p>
                </div>
              </div>
            </div>
            <p>
              <span className="font-medium">Supporting Document:</span>{" "}
              {supportingDocumentUrl ? (
                <a href={supportingDocumentUrl} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                  Open document
                </a>
              ) : (
                "N/A"
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-white">
          <CardHeader className="border-b border-emerald-100 bg-emerald-50/70">
            <CardTitle className="text-emerald-800">Legal Contacts</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p><span className="font-medium">Witness:</span> {borrower.witness_full_name ?? "N/A"}</p>
            <p><span className="font-medium">Witness Phone:</span> {borrower.witness_phone ?? "N/A"}</p>
            <p><span className="font-medium">Attorney:</span> {borrower.attorney_name ?? "N/A"}</p>
            <p><span className="font-medium">Law Firm:</span> {borrower.law_firm_name ?? "N/A"}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Client Loan Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Loan ID</TH>
                  <TH>Principal</TH>
                  <TH>Rate</TH>
                  <TH>Contract Date</TH>
                  <TH>Payment Due Date</TH>
                  <TH>Means of Payment</TH>
                  <TH>Unpaid Monthly Due</TH>
                  <TH>Arrears</TH>
                  <TH>Expiration</TH>
                  <TH>Amount to Refund</TH>
                </TR>
              </THead>
              <TBody>
                {loans.map((loan) => (
                  <TR key={loan.loan_id}>
                    <TD>{loan.loan_id}</TD>
                    <TD>{toCurrency(Number(loan.principal_amount))}</TD>
                    <TD>{Number(loan.interest_rate)}%</TD>
                    <TD>{new Date(loan.start_date).toLocaleDateString()}</TD>
                    <TD>{loan.payment_due_date ? new Date(loan.payment_due_date).toLocaleDateString() : "N/A"}</TD>
                    <TD>{loan.means_of_payment ?? "N/A"}</TD>
                    <TD>{loan.unpaid_monthly_due ? toCurrency(Number(loan.unpaid_monthly_due)) : "N/A"}</TD>
                    <TD>{loan.arrears ? toCurrency(Number(loan.arrears)) : "N/A"}</TD>
                    <TD>{new Date(loan.maturity_date).toLocaleDateString()}</TD>
                    <TD>
                      {loan.amount_balance_to_refund
                        ? toCurrency(Number(loan.amount_balance_to_refund))
                        : loan.collateral_estimated_value
                          ? toCurrency(Number(loan.collateral_estimated_value))
                          : "N/A"}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Loan ID</TH>
                  <TH>Amount</TH>
                  <TH>Type</TH>
                  <TH>Date</TH>
                  <TH>Notes</TH>
                </TR>
              </THead>
              <TBody>
                {payments.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="text-center text-muted-foreground">
                      No payment records for this client yet.
                    </TD>
                  </TR>
                ) : (
                  payments.map((payment) => (
                    <TR key={payment.id}>
                      <TD>{loanIdByDbId.get(payment.loan_id) ?? "N/A"}</TD>
                      <TD>{toCurrency(Number(payment.payment_amount))}</TD>
                      <TD>{payment.payment_type}</TD>
                      <TD>{new Date(payment.payment_date).toLocaleDateString()}</TD>
                      <TD>{payment.notes ?? "-"}</TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
