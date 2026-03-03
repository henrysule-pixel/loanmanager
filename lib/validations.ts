import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .refine((value) => value.replace(/\D/g, "").length >= 7, {
    message: "Phone number must contain at least 7 digits",
  });

const emailSchema = z.string().trim().email("Enter a valid email address");
const moneyAmountSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      // Allow money-like input: $1,250.75
      return trimmed.replace(/[$,\s]/g, "");
    }
    return value;
  },
  z.coerce.number().nonnegative().optional(),
);

export const borrowerSchema = z.object({
  full_name: z.string().min(2),
  first_name: z.string().min(2).optional(),
  last_name: z.string().min(2).optional(),
  phone: phoneSchema.optional(),
  phone_number: phoneSchema,
  email: emailSchema,
  client_address: z.string().min(5).optional(),
  address: z.string().min(5),
  contract_date: z.string().optional(),
  date_of_birth: z.string(),
  government_id: z.string().min(4).optional(),
  government_id_number: z.string().min(4),
  notes: z.string().optional(),
  supporting_document_name: z.string().optional(),
  lawyer_name: z.string().optional(),
  witness_full_name: z.string().optional(),
  witness_phone: z.string().optional(),
  witness_email: z.string().optional(),
  witness_address: z.string().optional(),
  attorney_name: z.string().optional(),
  law_firm_name: z.string().optional(),
  attorney_phone: z.string().optional(),
  attorney_email: z.string().optional(),
  attorney_office_address: z.string().optional(),
  loan_number: z.string().min(3).optional(),
  amount_borrowed: z.coerce.number().positive().optional(),
  current_balance: z.coerce.number().nonnegative().optional(),
  rate: z.coerce.number().min(0).optional(),
  amount_in_dollars: z.coerce.number().nonnegative().optional(),
  expiration_date: z.string().optional(),
  amount_balance_to_refund: z.coerce.number().nonnegative().optional(),
});

export const loanSchema = z.object({
  loan_id: z.string().min(3),
  borrower_id: z.string().uuid(),
  principal_amount: z.coerce.number().positive(),
  interest_rate: z.coerce.number().min(0),
  start_date: z.string(),
  maturity_date: z.string(),
  status: z.enum([
    "APPLICATION",
    "UNDER_REVIEW",
    "APPROVED",
    "FUNDED",
    "ACTIVE",
    "LATE",
    "DEFAULTED",
    "CLOSED",
  ]).optional(),
  loan_status: z.enum([
    "APPLICATION",
    "UNDER_REVIEW",
    "APPROVED",
    "FUNDED",
    "ACTIVE",
    "LATE",
    "DEFAULTED",
    "CLOSED",
  ]),
  collateral_description: z.string().optional(),
  collateral_estimated_value: z.coerce.number().nonnegative().optional(),
  risk_rating: z.string().optional(),
  notes: z.string().optional(),
});

export const loanPaymentSchema = z.object({
  loan_id: z.string().uuid(),
  amount: z.coerce.number().positive().optional(),
  payment_amount: z.coerce.number().positive(),
  payment_type: z.enum(["INTEREST", "PRINCIPAL", "PENALTY"]),
  payment_date: z.string(),
  notes: z.string().optional(),
});

export const loanMonitoringSchema = z.object({
  loan_id: z.string().uuid(),
  monthly_payment: moneyAmountSchema,
  contract_date: z.string().optional(),
  payment_due_date: z.string().optional(),
  unpaid_monthly_due: z.coerce.number().nonnegative().optional(),
  means_of_payment: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.enum(["CHEQUE", "INTERAC"]).optional(),
  ),
  arrears: moneyAmountSchema,
  expiration_date: z.string(),
  note: z.string().optional(),
  status_note: z.string().optional(),
});

export const investorSchema = z.object({
  full_name: z.string().min(2),
  first_name: z.string().min(2).optional(),
  last_name: z.string().min(2).optional(),
  phone: phoneSchema,
  email: emailSchema,
  investment_number: z.string().min(2).optional(),
  investment_date: z.string().optional(),
  investment_due_date: z.string().optional(),
  interest_rate: z.coerce.number().min(0).optional(),
  interest_rate_dollar: z.coerce.number().min(0).optional(),
  country: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  next_of_kin_name: z.string().min(2).optional(),
  next_of_kin_phone: phoneSchema.optional(),
  next_of_kin_email: emailSchema.optional(),
  address: z.string().min(5),
  total_capital_invested: z.coerce.number().nonnegative(),
  available_balance: z.coerce.number().nonnegative(),
  total_returns: z.coerce.number().nonnegative().optional(),
  total_returns_earned: z.coerce.number().nonnegative(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const investorUpdateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2),
  phone: phoneSchema,
  email: emailSchema,
  address: z.string().min(5),
  total_capital_invested: z.coerce.number().nonnegative(),
  available_balance: z.coerce.number().nonnegative(),
  total_returns_earned: z.coerce.number().nonnegative(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  notes: z.string().optional(),
});

export const investorTransactionSchema = z.object({
  investor_id: z.string().uuid(),
  loan_id: z.string().uuid().optional(),
  amount: z.coerce.number().positive(),
  transaction_type: z.enum(["DEPOSIT", "WITHDRAWAL", "ALLOCATION", "RETURN", "LOAN_ALLOCATION", "RETURN_PAYMENT"]),
  transaction_date: z.string(),
  notes: z.string().optional(),
});
