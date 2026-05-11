"use client";

import { useEffect, useState } from "react";
import { deleteOffice } from "./actions";

export function DeleteOfficeDialog({
  officeId,
  officeName,
  isDemo,
}: {
  officeId: string;
  officeName: string;
  isDemo: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const canConfirm = text === "삭제";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) setText("");
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
      >
        영구 삭제
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-red-800">
              {officeName} 영구 삭제
            </h3>

            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-900">
              <b>되돌릴 수 없습니다.</b>
              <br />
              이 사무실의 모든 데이터가 삭제됩니다:
              <ul className="mt-1 list-disc pl-4">
                <li>케이스 + 진행 메모 + 활동 기록</li>
                <li>초대 코드</li>
                <li>구독 정보</li>
              </ul>
              <p className="mt-2">
                ※ 직원 계정(로그인 정보) 자체는 보존되지만, 사무실 연결이
                해제되어 재가입이 필요합니다.
              </p>
            </div>

            <p className="mt-4 text-sm text-gray-700">
              정말 삭제하려면 아래에 <b className="text-red-700">"삭제"</b>라고
              입력하세요.
            </p>

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="삭제"
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
              autoFocus
            />

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
              >
                취소
              </button>
              <form action={deleteOffice}>
                <input type="hidden" name="office_id" value={officeId} />
                <input type="hidden" name="confirmation" value={text} />
                <button
                  type="submit"
                  disabled={!canConfirm}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDemo ? "데모 삭제" : "영구 삭제"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
