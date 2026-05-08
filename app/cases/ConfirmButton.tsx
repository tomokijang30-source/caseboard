"use client";

import type { ButtonHTMLAttributes } from "react";

export function ConfirmButton({
  message,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { message: string }) {
  return (
    <button
      {...rest}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
