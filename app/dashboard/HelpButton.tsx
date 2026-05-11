"use client";

import { useEffect, useState } from "react";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const copyKakao = async () => {
    try {
      await navigator.clipboard.writeText("cavin1234");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        title="문의·기능 요청"
      >
        문의·요청
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  문의 · 기능 요청
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  기능 추가·수정 요청, 사용 중 문제, 무엇이든 편하게 알려주세요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="-mr-2 -mt-1 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <ul className="mt-5 space-y-2 text-sm">
              <li>
                <a
                  href="tel:01076471312"
                  className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2.5 hover:border-gray-400 hover:bg-gray-50"
                >
                  <span className="text-lg leading-none">📞</span>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900">010-7647-1312</div>
                    <div className="text-xs text-gray-500">전화 · 문자</div>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href="mailto:caseboard443@gmail.com"
                  className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2.5 hover:border-gray-400 hover:bg-gray-50"
                >
                  <span className="text-lg leading-none">📧</span>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-gray-900">
                      caseboard443@gmail.com
                    </div>
                    <div className="text-xs text-gray-500">이메일</div>
                  </div>
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={copyKakao}
                  className="flex w-full items-center gap-3 rounded-md border border-gray-200 px-3 py-2.5 text-left hover:border-gray-400 hover:bg-gray-50"
                >
                  <span className="text-lg leading-none">💬</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900">
                      카카오톡 ID: cavin1234
                    </div>
                    <div className="text-xs text-gray-500">
                      {copied ? "복사됨" : "클릭하면 ID 복사"}
                    </div>
                  </div>
                </button>
              </li>
            </ul>

            <p className="mt-5 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
              💡 기능 요청은 평균 <b>2-3일 내</b>에 반영해 드립니다.
            </p>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
