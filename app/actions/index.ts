"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { recomputeInvestorBalances } from "@/lib/investors/capital";
import { assertValidLoanStatusTransition } from "@/lib/loans/status-workflow";
import {
  borrowerSchema,
  borrowerUpdateSchema,
  investorSchema,
  investorUpdateSchema,
  investorTransactionSchema,
  loanMonitoringCreateSchema,
  loanMonitoringSchema,
  loanPaymentSchema,
  loanSchema,
} from "@/lib/validations";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/types/database";

export async function createBorrowerAction(formData: FormData) {
  await requireUserId();
  const rawEntries = Object.fromEntries(formData.entries());
  if (!rawEntries.address && rawEntries.client_address) {
    rawEntries.address = rawEntries.client_address;
  }
  const parsed = borrowerSchema.parse(rawEntries);
  const fullName = `${parsed.first_name ?? ""} ${parsed.last_name ?? ""}`.trim() || parsed.full_name;
  const supportingDocumentFile = formData.get("supporting_document");
  const uploadedFileName =
    supportingDocumentFile instanceof File && supportingDocumentFile.size > 0 ? supportingDocumentFile.name : null;
  const buildIntakeRecord = (documentUrl?: string | null) =>
    [
      `Loan Number: ${parsed.loan_number ?? "N/A"}`,
      `Contract Date: ${parsed.contract_date ?? "N/A"}`,
      `First Name: ${parsed.first_name ?? "N/A"}`,
      `Last Name: ${parsed.last_name ?? "N/A"}`,
      `Phone Number: ${parsed.phone_number ?? parsed.phone ?? "N/A"}`,
      `Email: ${parsed.email ?? "N/A"}`,
      `Date of Birth: ${parsed.date_of_birth ?? "N/A"}`,
      `Amount Borrowed: ${parsed.amount_borrowed ?? "N/A"}`,
      `Current Balance: ${parsed.current_balance ?? "N/A"}`,
      `Rate (%): ${parsed.rate ?? "N/A"}`,
      `Amount in Dollars: ${parsed.amount_in_dollars ?? "N/A"}`,
      `Expiration Date: ${parsed.expiration_date ?? "N/A"}`,
      `Amount Balance to Refund: ${parsed.amount_balance_to_refund ?? "N/A"}`,
      `Client Address: ${parsed.address ?? "N/A"}`,
      `Government ID: ${parsed.government_id ?? parsed.government_id_number ?? "N/A"}`,
      `Lawyer Name: ${parsed.lawyer_name ?? parsed.attorney_name ?? "N/A"}`,
      `Lawyer Phone: ${parsed.attorney_phone ?? "N/A"}`,
      `Lawyer Email: ${parsed.attorney_email ?? "N/A"}`,
      `Witness Name: ${parsed.witness_full_name ?? "N/A"}`,
      `Witness Phone: ${parsed.witness_phone ?? "N/A"}`,
      `Witness Email: ${parsed.witness_email ?? "N/A"}`,
      `Witness Address: ${parsed.witness_address ?? "N/A"}`,
      `Law Firm Name: ${parsed.law_firm_name ?? "N/A"}`,
      `Attorney Office Address: ${parsed.attorney_office_address ?? "N/A"}`,
      `Supporting Document Name: ${uploadedFileName ?? parsed.supporting_document_name ?? "N/A"}`,
      `Supporting Document URL: ${documentUrl ?? "N/A"}`,
      `Note: ${parsed.notes ?? "N/A"}`,
    ].join("\n");
  const payload = {
    first_name: parsed.first_name ?? null,
    last_name: parsed.last_name ?? null,
    full_name: fullName,
    phone: parsed.phone ?? parsed.phone_number,
    phone_number: parsed.phone_number ?? parsed.phone,
    address: parsed.address,
    email: parsed.email,
    contract_date: parsed.contract_date ?? null,
    date_of_birth: parsed.date_of_birth,
    government_id: parsed.government_id ?? parsed.government_id_number,
    government_id_number: parsed.government_id_number ?? parsed.government_id,
    supporting_document_url: null as string | null,
    notes: parsed.notes,
    intake_record: buildIntakeRecord(null),
    witness_full_name: parsed.witness_full_name,
    witness_phone: parsed.witness_phone,
    witness_email: parsed.witness_email,
    witness_address: parsed.witness_address,
    attorney_name: parsed.attorney_name ?? parsed.lawyer_name,
    law_firm_name: parsed.law_firm_name,
    attorney_phone: parsed.attorney_phone,
    attorney_email: parsed.attorney_email,
    attorney_office_address: parsed.attorney_office_address,
  };
  const supabase = createSupabaseServerClient();
  let supportingDocumentPublicUrl: string | null = null;

  if (supportingDocumentFile instanceof File && supportingDocumentFile.size > 0) {
    const bucketName = "borrower-documents";
    const { data: bucket } = await supabase.storage.getBucket(bucketName);
    if (!bucket) {
      const { error: bucketError } = await supabase.storage.createBucket(bucketName, { public: true });
      if (bucketError && !bucketError.message.toLowerCase().includes("already exists")) {
        throw new Error(bucketError.message);
      }
    }

    const extension = supportingDocumentFile.name.includes(".")
      ? supportingDocumentFile.name.split(".").pop()
      : "bin";
    const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const fileArrayBuffer = await supportingDocumentFile.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileArrayBuffer, { contentType: supportingDocumentFile.type || "application/octet-stream" });
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    supportingDocumentPublicUrl = publicUrlData.publicUrl;
  }

  if (supportingDocumentPublicUrl) {
    payload.supporting_document_url = supportingDocumentPublicUrl;
  }
  payload.intake_record = buildIntakeRecord(supportingDocumentPublicUrl);

  let borrowerInsertResult = await supabase.from("borrowers").insert(payload).select("id").single();
  if (
    borrowerInsertResult.error &&
    /first_name|last_name|contract_date|supporting_document_url|intake_record/i.test(borrowerInsertResult.error.message)
  ) {
    const legacyNotes = [parsed.notes, "", "INTAKE RECORD", payload.intake_record].filter(Boolean).join("\n");
    const legacyBorrowerPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([key]) => !["first_name", "last_name", "contract_date", "supporting_document_url", "intake_record"].includes(key),
      ),
    );
    legacyBorrowerPayload.notes = legacyNotes;
    borrowerInsertResult = await supabase.from("borrowers").insert(legacyBorrowerPayload).select("id").single();
  }
  if (borrowerInsertResult.error) throw new Error(borrowerInsertResult.error.message);
  const borrowerData = borrowerInsertResult.data;

  if (parsed.loan_number) {
    const contractDate = parsed.contract_date ?? new Date().toISOString().slice(0, 10);
    const expirationDate = parsed.expiration_date ?? contractDate;
    const principal = parsed.amount_borrowed ?? parsed.amount_in_dollars ?? 0;
    const rate = parsed.rate ?? 0;
    const currentBalance = parsed.current_balance ?? parsed.amount_balance_to_refund;
    const loanPayload = {
      loan_id: parsed.loan_number,
      borrower_id: borrowerData.id,
      principal_amount: principal,
      interest_rate: rate,
      start_date: contractDate,
      maturity_date: expirationDate,
      status: "APPLICATION",
      loan_status: "APPLICATION",
      collateral_description: parsed.supporting_document_name
        ? `Supporting document: ${parsed.supporting_document_name}`
        : supportingDocumentPublicUrl
          ? `Supporting document: ${supportingDocumentPublicUrl}`
          : null,
      collateral_estimated_value: currentBalance,
      current_balance: parsed.current_balance ?? null,
      amount_in_dollars: parsed.amount_in_dollars ?? null,
      amount_balance_to_refund: parsed.amount_balance_to_refund ?? null,
      risk_rating: "MEDIUM",
      notes: parsed.notes,
    };
    let loanInsertResult = await supabase.from("loans").insert(loanPayload);
    if (
      loanInsertResult.error &&
      /current_balance|amount_in_dollars|amount_balance_to_refund/i.test(loanInsertResult.error.message)
    ) {
      const legacyLoanPayload = Object.fromEntries(
        Object.entries(loanPayload).filter(
          ([key]) => !["current_balance", "amount_in_dollars", "amount_balance_to_refund"].includes(key),
        ),
      );
      loanInsertResult = await supabase.from("loans").insert(legacyLoanPayload);
    }
    if (loanInsertResult.error) throw new Error(loanInsertResult.error.message);
  }

  revalidatePath("/dashboard/borrowers");
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard");
}

export async function createLoanAction(formData: FormData) {
  await requireUserId();
  const parsed = loanSchema.parse(Object.fromEntries(formData.entries()));
  const payload = {
    ...parsed,
    status: parsed.status ?? parsed.loan_status,
    loan_status: parsed.loan_status ?? parsed.status,
  };
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from("loans").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard");
}

export async function updateLoanStatusAction(formData: FormData) {
  await requireUserId();
  const loanId = String(formData.get("loan_id"));
  const loanStatus = String(formData.get("loan_status"));
  const supabase = createSupabaseServerClient();
  const { data: loanData, error: loanLookupError } = await supabase
    .from("loans")
    .select("loan_status, status")
    .eq("id", loanId)
    .single();
  if (loanLookupError || !loanData) throw new Error("Loan not found");

  const currentStatus = (loanData.status ?? loanData.loan_status) as Database["public"]["Enums"]["loan_status"];
  const nextStatus = loanStatus as Database["public"]["Enums"]["loan_status"];
  assertValidLoanStatusTransition(currentStatus, nextStatus);

  const { error } = await supabase.from("loans").update({ loan_status: loanStatus, status: loanStatus }).eq("id", loanId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard");
}

export async function createLoanPaymentAction(formData: FormData) {
  await requireUserId();
  const parsed = loanPaymentSchema.parse(Object.fromEntries(formData.entries()));
  const payload = {
    ...parsed,
    amount: parsed.amount ?? parsed.payment_amount,
    payment_amount: parsed.payment_amount ?? parsed.amount,
  };
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from("loan_payments").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/loans");
}

export async function updateLoanMonitoringAction(formData: FormData) {
  await requireUserId();
  const parsed = loanMonitoringSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = createSupabaseServerClient();
  const { data: loanData, error: loanLookupError } = await supabase
    .from("loans")
    .select("notes")
    .eq("id", parsed.loan_id)
    .single();
  if (loanLookupError || !loanData) throw new Error("Loan not found");

  const latestNote = parsed.note ?? parsed.status_note;
  const mergedNotes = [loanData.notes, latestNote].filter(Boolean).join("\n");
  const payload = {
    principal_amount: parsed.principal_amount ?? null,
    monthly_payment: parsed.monthly_payment ?? null,
    start_date: parsed.contract_date || undefined,
    payment_due_date: parsed.payment_due_date || null,
    unpaid_monthly_due: parsed.unpaid_monthly_due ?? null,
    means_of_payment: parsed.means_of_payment ?? null,
    arrears: parsed.arrears ?? null,
    maturity_date: parsed.expiration_date,
    notes: mergedNotes || null,
  };

  let updateResult = await supabase.from("loans").update(payload).eq("id", parsed.loan_id);
  if (
    updateResult.error &&
    /principal_amount|monthly_payment|payment_due_date|unpaid_monthly_due|means_of_payment|arrears/i.test(updateResult.error.message)
  ) {
    const fallbackPayload = {
      start_date: parsed.contract_date || undefined,
      maturity_date: parsed.expiration_date,
      notes: mergedNotes || null,
    };
    updateResult = await supabase.from("loans").update(fallbackPayload).eq("id", parsed.loan_id);
  }
  if (updateResult.error) throw new Error(updateResult.error.message);

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard");
}

export async function createLoanMonitoringRowAction(formData: FormData) {
  await requireUserId();
  const parsed = loanMonitoringCreateSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = createSupabaseServerClient();

  const payload = {
    loan_id: parsed.loan_id,
    borrower_id: parsed.borrower_id,
    principal_amount: parsed.principal_amount,
    interest_rate: 0,
    start_date: parsed.contract_date,
    maturity_date: parsed.expiration_date,
    status: "APPLICATION" as Database["public"]["Enums"]["loan_status"],
    loan_status: "APPLICATION" as Database["public"]["Enums"]["loan_status"],
    risk_rating: "MEDIUM",
    monthly_payment: parsed.monthly_payment ?? null,
    payment_due_date: parsed.payment_due_date || null,
    unpaid_monthly_due: parsed.unpaid_monthly_due ?? null,
    means_of_payment: parsed.means_of_payment ?? null,
    arrears: parsed.arrears ?? null,
    notes: parsed.note?.trim() ? parsed.note.trim() : null,
  };

  let insertResult = await supabase.from("loans").insert(payload);
  if (insertResult.error && /monthly_payment|payment_due_date|unpaid_monthly_due|means_of_payment|arrears/i.test(insertResult.error.message)) {
    const fallbackPayload = {
      loan_id: parsed.loan_id,
      borrower_id: parsed.borrower_id,
      principal_amount: parsed.principal_amount,
      interest_rate: 0,
      start_date: parsed.contract_date,
      maturity_date: parsed.expiration_date,
      status: "APPLICATION" as Database["public"]["Enums"]["loan_status"],
      loan_status: "APPLICATION" as Database["public"]["Enums"]["loan_status"],
      risk_rating: "MEDIUM",
      notes: parsed.note?.trim() ? parsed.note.trim() : null,
    };
    insertResult = await supabase.from("loans").insert(fallbackPayload);
  }
  if (insertResult.error) throw new Error(insertResult.error.message);

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard");
}

export async function createInvestorAction(formData: FormData) {
  await requireUserId();
  const rawEntries = Object.fromEntries(formData.entries());
  if (!rawEntries.full_name && (rawEntries.first_name || rawEntries.last_name)) {
    rawEntries.full_name = `${String(rawEntries.first_name ?? "")} ${String(rawEntries.last_name ?? "")}`.trim();
  }
  if (!rawEntries.address) {
    rawEntries.address = [String(rawEntries.state ?? "").trim(), String(rawEntries.country ?? "").trim()]
      .filter(Boolean)
      .join(", ");
  }
  if (!rawEntries.available_balance) {
    rawEntries.available_balance = rawEntries.total_capital_invested ?? "0";
  }
  const validation = investorSchema.safeParse(rawEntries);
  if (!validation.success) {
    throw new Error(validation.error.issues[0]?.message ?? "Invalid investor details");
  }
  const parsed = validation.data;
  const supabase = createSupabaseServerClient();
  const investorDocumentFile = formData.get("investor_document");
  const nextOfKinDocumentFile = formData.get("next_of_kin_document");
  let investorDocumentUrl: string | null = null;
  let nextOfKinDocumentUrl: string | null = null;

  const uploadFile = async (file: File, prefix: string) => {
    const bucketName = "investor-documents";
    const { data: bucket } = await supabase.storage.getBucket(bucketName);
    if (!bucket) {
      const { error: bucketError } = await supabase.storage.createBucket(bucketName, { public: true });
      if (bucketError && !bucketError.message.toLowerCase().includes("already exists")) {
        throw new Error(bucketError.message);
      }
    }
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const filePath = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const fileArrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileArrayBuffer, { contentType: file.type || "application/octet-stream" });
    if (uploadError) throw new Error(uploadError.message);
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  if (investorDocumentFile instanceof File && investorDocumentFile.size > 0) {
    investorDocumentUrl = await uploadFile(investorDocumentFile, "investor");
  }
  if (nextOfKinDocumentFile instanceof File && nextOfKinDocumentFile.size > 0) {
    nextOfKinDocumentUrl = await uploadFile(nextOfKinDocumentFile, "next-of-kin");
  }

  const details = [
    parsed.investment_number ? `Investment Number: ${parsed.investment_number}` : null,
    parsed.investment_date ? `Investment Date: ${parsed.investment_date}` : null,
    parsed.investment_due_date ? `Investment Due Date: ${parsed.investment_due_date}` : null,
    parsed.interest_rate !== undefined ? `Interest Rate (%): ${parsed.interest_rate}` : null,
    parsed.interest_rate_dollar !== undefined ? `Interest Rate ($): ${parsed.interest_rate_dollar}` : null,
    parsed.country ? `Country: ${parsed.country}` : null,
    parsed.state ? `State: ${parsed.state}` : null,
    parsed.next_of_kin_name ? `Next of Kin: ${parsed.next_of_kin_name}` : null,
    parsed.next_of_kin_phone ? `Next of Kin Phone: ${parsed.next_of_kin_phone}` : null,
    parsed.next_of_kin_email ? `Next of Kin Email: ${parsed.next_of_kin_email}` : null,
    investorDocumentUrl ? `Investor Document: ${investorDocumentUrl}` : null,
    nextOfKinDocumentUrl ? `Next of Kin Document: ${nextOfKinDocumentUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const payload = {
    full_name: parsed.full_name,
    phone: parsed.phone,
    email: parsed.email,
    address: parsed.address,
    total_capital_invested: parsed.total_capital_invested,
    available_balance: parsed.available_balance,
    total_returns: parsed.total_returns ?? parsed.total_returns_earned,
    total_returns_earned: parsed.total_returns_earned ?? parsed.total_returns,
    status: parsed.status,
    notes: details,
  };

  let investorInsertResult = await supabase.from("investors").insert(payload);
  if (investorInsertResult.error && /notes/i.test(investorInsertResult.error.message)) {
    const { notes, ...legacyInvestorPayload } = payload;
    void notes;
    investorInsertResult = await supabase.from("investors").insert(legacyInvestorPayload);
  }
  if (investorInsertResult.error) throw new Error(investorInsertResult.error.message);
  revalidatePath("/dashboard/investors");
  revalidatePath("/dashboard");
}

export async function createInvestorTransactionAction(formData: FormData) {
  await requireUserId();
  const parsed = investorTransactionSchema.parse(Object.fromEntries(formData.entries()));
  const payload = {
    ...parsed,
    transaction_type:
      parsed.transaction_type === "LOAN_ALLOCATION"
        ? "ALLOCATION"
        : parsed.transaction_type === "RETURN_PAYMENT"
          ? "RETURN"
          : parsed.transaction_type,
  };
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from("investor_transactions").insert(payload);
  if (error) throw new Error(error.message);
  await recomputeInvestorBalances(payload.investor_id);
  revalidatePath("/dashboard/investors");
  revalidatePath("/dashboard");
}

export async function updateInvestorAction(formData: FormData) {
  await requireUserId();
  const parsed = investorUpdateSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = createSupabaseServerClient();

  const payload = {
    full_name: parsed.full_name,
    phone: parsed.phone,
    email: parsed.email,
    address: parsed.address,
    total_capital_invested: parsed.total_capital_invested,
    available_balance: parsed.available_balance,
    total_returns_earned: parsed.total_returns_earned,
    total_returns: parsed.total_returns_earned,
    status: parsed.status,
    notes: parsed.notes ?? null,
  };

  let updateResult = await supabase.from("investors").update(payload).eq("id", parsed.id);
  if (updateResult.error && /notes/i.test(updateResult.error.message)) {
    const { notes, ...fallbackPayload } = payload;
    void notes;
    updateResult = await supabase.from("investors").update(fallbackPayload).eq("id", parsed.id);
  }
  if (updateResult.error) throw new Error(updateResult.error.message);

  revalidatePath("/dashboard/investors");
  revalidatePath(`/dashboard/investors/${parsed.id}`);
}

export async function updateBorrowerAction(formData: FormData) {
  await requireUserId();
  const parsed = borrowerUpdateSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = createSupabaseServerClient();

  const fullName = `${parsed.first_name} ${parsed.last_name}`.trim();
  const intakeRecord = [
    `First Name: ${parsed.first_name}`,
    `Last Name: ${parsed.last_name}`,
    `Phone Number: ${parsed.phone_number}`,
    `Email: ${parsed.email}`,
    `Client Address: ${parsed.address}`,
    `Contract Date: ${parsed.contract_date || "N/A"}`,
    `Date of Birth: ${parsed.date_of_birth || "N/A"}`,
    `Government ID: ${parsed.government_id_number}`,
    `Lawyer Name: ${parsed.attorney_name || "N/A"}`,
    `Lawyer Phone: ${parsed.attorney_phone || "N/A"}`,
    `Lawyer Email: ${parsed.attorney_email || "N/A"}`,
    `Note: ${parsed.notes || "N/A"}`,
  ].join("\n");

  const payload = {
    first_name: parsed.first_name,
    last_name: parsed.last_name,
    full_name: fullName,
    phone: parsed.phone_number,
    phone_number: parsed.phone_number,
    email: parsed.email,
    address: parsed.address,
    contract_date: parsed.contract_date || null,
    date_of_birth: parsed.date_of_birth || undefined,
    government_id: parsed.government_id_number,
    government_id_number: parsed.government_id_number,
    attorney_name: parsed.attorney_name || null,
    attorney_phone: parsed.attorney_phone || null,
    attorney_email: parsed.attorney_email || null,
    notes: parsed.notes || null,
    intake_record: intakeRecord,
  };

  let updateResult = await supabase.from("borrowers").update(payload).eq("id", parsed.id);
  if (updateResult.error && /first_name|last_name|contract_date|intake_record/i.test(updateResult.error.message)) {
    const { first_name, last_name, contract_date, intake_record, ...fallbackPayload } = payload;
    void first_name;
    void last_name;
    void contract_date;
    void intake_record;
    updateResult = await supabase.from("borrowers").update(fallbackPayload).eq("id", parsed.id);
  }
  if (updateResult.error) throw new Error(updateResult.error.message);

  revalidatePath("/dashboard/borrowers");
  revalidatePath(`/dashboard/borrowers/${parsed.id}`);
  revalidatePath("/dashboard");
}
