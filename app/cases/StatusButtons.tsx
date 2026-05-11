"use client";

import { useOptimistic, useTransition } from "react";
import { updateCaseStatus } from "./actions";
import {
  type CaseStatus,
  STATUSES,
  STATUS_LABEL,
  STATUS_PILL,
} from "@/app/dashboard/status";

export function StatusButtons({
  caseId,
  current,
}: {
  caseId: string;
  current: CaseStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic<CaseStatus, CaseStatus>(
    current,
    (_state, next) => next,
  );

  const handle = (next: CaseStatus) => {
    if (next === optimistic) return;
    startTransition(async () => {
      setOptimistic(next);
      const fd = new FormData();
      fd.set("case_id", caseId);
      fd.set("status", next);
      await updateCaseStatus(fd);
    });
  };

  return (
    <div className="flex shrink-0 items-center gap-1">
      {STATUSES.map((s) => {
        const active = optimistic === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => handle(s)}
            disabled={isPending && !active}
            className={
              active
                ? `rounded-md px-2.5 py-1 text-xs font-medium ${STATUS_PILL[s]}`
                : "rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-900 disabled:opacity-40"
            }
          >
            {STATUS_LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}
