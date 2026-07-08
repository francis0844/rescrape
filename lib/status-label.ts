import type { SourceRow } from "@/lib/app-data";

const LABELS: Record<SourceRow["status"], string> = {
  pending: "pending",
  scanning: "scanning",
  ai_approved: "ai_approved",
  ai_rejected: "ai_rejected",
  needs_review: "needs_review",
  approved: "User Approved",
  rejected: "User Rejected"
};

/** Cosmetic only — the underlying status column keeps its original enum values. */
export function statusLabel(status: SourceRow["status"]): string {
  return LABELS[status];
}
