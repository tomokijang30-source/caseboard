import Link from "next/link";
import { type CaseStatus, STATUSES, STATUS_LABEL } from "./status";

export type DashboardSearchParams = {
  q?: string;
  status?: string;
  staff?: string;
};

export function isStatus(s: string | undefined): s is CaseStatus {
  return s === "ongoing" || s === "waiting" || s === "done";
}

export function buildHref(
  current: DashboardSearchParams,
  override: Partial<DashboardSearchParams>,
) {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...current, ...override })) {
    if (v !== undefined && v !== "" && v !== null) merged[k] = String(v);
  }
  return { pathname: "/dashboard", query: merged };
}

export function StatusFilter({
  searchParams,
  counts,
}: {
  searchParams: DashboardSearchParams;
  counts: Record<"total" | CaseStatus, number>;
}) {
  const current = isStatus(searchParams.status) ? searchParams.status : null;

  const Item = ({
    status,
    label,
    count,
  }: {
    status: CaseStatus | null;
    label: string;
    count: number;
  }) => {
    const active = status === current;
    return (
      <Link
        href={buildHref(searchParams, { status: status ?? undefined })}
        className={
          active
            ? "rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white"
            : "rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400"
        }
      >
        {label} <span className="tabular-nums opacity-70">{count}</span>
      </Link>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Item status={null} label="전체" count={counts.total} />
      {STATUSES.map((s) => (
        <Item key={s} status={s} label={STATUS_LABEL[s]} count={counts[s]} />
      ))}
    </div>
  );
}
