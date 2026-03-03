import type { Database } from "@/types/database";

type LoanStatus = Database["public"]["Enums"]["loan_status"];

const allowedTransitions: Record<LoanStatus, LoanStatus[]> = {
  APPLICATION: ["UNDER_REVIEW", "APPROVED", "DEFAULTED"],
  UNDER_REVIEW: ["APPROVED", "APPLICATION", "DEFAULTED"],
  APPROVED: ["FUNDED", "UNDER_REVIEW", "DEFAULTED"],
  FUNDED: ["ACTIVE", "DEFAULTED"],
  ACTIVE: ["LATE", "CLOSED", "DEFAULTED"],
  LATE: ["ACTIVE", "DEFAULTED", "CLOSED"],
  DEFAULTED: ["CLOSED"],
  CLOSED: [],
};

export function assertValidLoanStatusTransition(current: LoanStatus, next: LoanStatus) {
  if (current === next) return;
  const allowed = allowedTransitions[current] ?? [];
  if (!allowed.includes(next)) {
    throw new Error(`Invalid status transition from ${current} to ${next}`);
  }
}
