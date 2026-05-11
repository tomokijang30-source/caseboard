"use client";

import { useState } from "react";

export function InviteCodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-2 rounded-md px-1.5 py-0.5 font-mono text-base font-semibold tracking-widest text-gray-900 hover:bg-gray-100"
      title="클릭하여 복사"
    >
      <span>{code}</span>
      <span
        className={`text-[10px] font-sans font-medium tracking-normal ${
          copied
            ? "text-emerald-600"
            : "text-gray-400 opacity-0 group-hover:opacity-100"
        }`}
      >
        {copied ? "복사됨" : "복사"}
      </span>
    </button>
  );
}
