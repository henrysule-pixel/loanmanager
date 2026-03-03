export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type LoanStatus =
  | "APPLICATION"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "FUNDED"
  | "ACTIVE"
  | "LATE"
  | "DEFAULTED"
  | "CLOSED";

export type PaymentType = "INTEREST" | "PRINCIPAL" | "PENALTY";
export type InvestorStatus = "ACTIVE" | "INACTIVE";
export type InvestorTransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "ALLOCATION"
  | "RETURN"
  | "LOAN_ALLOCATION"
  | "RETURN_PAYMENT";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_user_id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "staff";
          created_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          email: string;
          full_name?: string | null;
          role?: "admin" | "staff";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      borrowers: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          full_name: string;
          phone: string;
          phone_number: string;
          email: string;
          address: string;
          contract_date: string | null;
          date_of_birth: string;
          government_id: string;
          government_id_number: string;
          supporting_document_url: string | null;
          notes: string | null;
          intake_record: string | null;
          witness_full_name: string | null;
          witness_phone: string | null;
          witness_email: string | null;
          witness_address: string | null;
          attorney_name: string | null;
          law_firm_name: string | null;
          attorney_phone: string | null;
          attorney_email: string | null;
          attorney_office_address: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          full_name: string;
          phone?: string;
          phone_number: string;
          email: string;
          address: string;
          contract_date?: string | null;
          date_of_birth: string;
          government_id?: string;
          government_id_number: string;
          supporting_document_url?: string | null;
          notes?: string | null;
          intake_record?: string | null;
          witness_full_name?: string | null;
          witness_phone?: string | null;
          witness_email?: string | null;
          witness_address?: string | null;
          attorney_name?: string | null;
          law_firm_name?: string | null;
          attorney_phone?: string | null;
          attorney_email?: string | null;
          attorney_office_address?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["borrowers"]["Insert"]>;
      };
      loans: {
        Row: {
          id: string;
          loan_id: string;
          borrower_id: string;
          principal_amount: number;
          interest_rate: number;
          start_date: string;
          maturity_date: string;
          status: LoanStatus;
          loan_status: LoanStatus;
          collateral_description: string | null;
          collateral_estimated_value: number | null;
          current_balance: number | null;
          amount_in_dollars: number | null;
          amount_balance_to_refund: number | null;
          monthly_payment: number | null;
          payment_due_date: string | null;
          unpaid_monthly_due: number | null;
          means_of_payment: string | null;
          arrears: number | null;
          risk_rating: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          borrower_id: string;
          principal_amount: number;
          interest_rate: number;
          start_date: string;
          maturity_date: string;
          status?: LoanStatus;
          loan_status?: LoanStatus;
          collateral_description?: string | null;
          collateral_estimated_value?: number | null;
          current_balance?: number | null;
          amount_in_dollars?: number | null;
          amount_balance_to_refund?: number | null;
          monthly_payment?: number | null;
          payment_due_date?: string | null;
          unpaid_monthly_due?: number | null;
          means_of_payment?: string | null;
          arrears?: number | null;
          risk_rating?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["loans"]["Insert"]>;
      };
      loan_payments: {
        Row: {
          id: string;
          loan_id: string;
          amount: number;
          payment_amount: number;
          payment_type: PaymentType;
          payment_date: string;
          recorded_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          amount?: number;
          payment_amount: number;
          payment_type: PaymentType;
          payment_date?: string;
          recorded_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["loan_payments"]["Insert"]>;
      };
      investors: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string;
          address: string;
          notes: string | null;
          total_capital_invested: number;
          available_balance: number;
          total_returns: number;
          total_returns_earned: number;
          status: InvestorStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email: string;
          address: string;
          notes?: string | null;
          total_capital_invested?: number;
          available_balance?: number;
          total_returns?: number;
          total_returns_earned?: number;
          status?: InvestorStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["investors"]["Insert"]>;
      };
      investor_transactions: {
        Row: {
          id: string;
          investor_id: string;
          loan_id: string | null;
          amount: number;
          transaction_type: InvestorTransactionType;
          transaction_date: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          investor_id: string;
          loan_id?: string | null;
          amount: number;
          transaction_type: InvestorTransactionType;
          transaction_date?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["investor_transactions"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      loan_status: LoanStatus;
      payment_type: PaymentType;
      investor_status: InvestorStatus;
      investor_transaction_type: InvestorTransactionType;
    };
  };
}
