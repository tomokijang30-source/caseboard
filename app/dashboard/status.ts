export type CaseStatus = "ongoing" | "waiting" | "done";

export const STATUSES: CaseStatus[] = ["ongoing", "waiting", "done"];

export const STATUS_LABEL: Record<CaseStatus, string> = {
  ongoing: "진행중",
  waiting: "대기중",
  done: "완료",
};

export const STATUS_PILL: Record<CaseStatus, string> = {
  ongoing: "bg-blue-100 text-blue-800",
  waiting: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-700",
};
