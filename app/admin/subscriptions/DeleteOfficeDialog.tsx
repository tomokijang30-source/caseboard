"use client";

import { useEffect, useState, useTransition } from "react";
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
  const [pending, startTransition] = useTransition();

  // 데모: "삭제" 입력 OK / 실고객: 사무실명 정확히 입력
  const requiredText = isDemo ? "삭제" : officeName;
  const canConfirm = !pending && text.trim() === requiredText;

  useEffect(() => {
    if (!open) {
      setText("");
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending]);

  const handleDelete = () => {
    if (!canConfirm) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("office_id", officeId);
      formData.set("confirmation", text.trim());
      try {
        await deleteOffice(formData);
        setOpen(false);
      } catch (e) {
        // 서버에서 throw 시 표면화. revalidate 이미 발생했을 가능성 있어 모달 닫기.
        console.error("deleteOffice failed:", e);
        alert(
          "삭제 실패: " +
            (e instanceof Error ? e.message : String(e)) +
            "\n페이지를 새로고침한 후 다시 시도해주세요.",
        );
        setOpen(false);
      }
    });
  };

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
          onClick={() => {
            if (!pending) setOpen(false);
          }}
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

            <div className="mt-4 rounded-md bg-gray-50 px-3 py-2 text-sm">
              {isDemo ? (
                <>
                  <p className="text-gray-700">
                    이건 <b className="text-purple-700">데모 사무실</b>입니다.
                    삭제하려면 아래에{" "}
                    <b className="rounded bg-white px-1 py-0.5 font-mono text-red-700">
                      삭제
                    </b>{" "}
                    라고 입력하세요.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-700">
                    <b className="text-red-700">실고객 사무실</b>입니다. 정말
                    삭제하려면 아래에 사무실 이름을 정확히 입력하세요:
                  </p>
                  <p className="mt-1.5 rounded bg-white px-2 py-1 font-mono text-sm font-semibold text-red-700">
                    {officeName}
                  </p>
                </>
              )}
            </div>

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={requiredText}
              disabled={pending}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none disabled:opacity-60"
              autoFocus
            />

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canConfirm}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending
                  ? "삭제 중..."
                  : isDemo
                    ? "데모 삭제"
                    : "영구 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
