import type { CaseStatus } from "./status";

type SortableCase = {
  status: CaseStatus;
  deadline: string | null;
  updated_at: string;
};

export function sortCasesByUrgency<T extends SortableCase>(cases: T[]): T[] {
  return [...cases].sort((a, b) => {
    const aDone = a.status === "done" ? 1 : 0;
    const bDone = b.status === "done" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;

    const aNoDeadline = a.deadline ? 0 : 1;
    const bNoDeadline = b.deadline ? 0 : 1;
    if (aNoDeadline !== bNoDeadline) return aNoDeadline - bNoDeadline;

    if (a.deadline && b.deadline) {
      const cmp = a.deadline.localeCompare(b.deadline);
      if (cmp !== 0) return cmp;
    }

    return b.updated_at.localeCompare(a.updated_at);
  });
}

export function staleDays(updatedAt: string, status: CaseStatus): number | null {
  if (status === "done") return null;
  const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86400000);
  return days >= 3 ? days : null;
}

export function deadlineUrgency(
  deadline: string | null,
  status: CaseStatus,
): "overdue" | "soon" | "none" {
  if (!deadline || status === "done") return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline + "T00:00:00");
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "soon";
  return "none";
}
