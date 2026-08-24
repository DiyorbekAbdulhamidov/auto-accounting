"use client";

import { Search } from "lucide-react";
import { cx, fieldClasses, fieldWidth, labelClasses } from "./styles";

/** Yorliq + maydon + izoh. Yorliq HAR DOIM maydon ustida bo'ladi. */
export function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className={labelClasses} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-caption text-ink-3">{hint}</p>}
    </div>
  );
}

export function Input({
  className,
  mono = false,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return (
    <input
      {...rest}
      className={cx(fieldClasses, fieldWidth(className), mono && "font-mono", className)}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={cx(fieldClasses, fieldWidth(className), "cursor-pointer pr-8", className)}
    >
      {children}
    </select>
  );
}

/** Qidiruv maydoni — belgisi ichida. */
export function SearchInput({
  className,
  wrapClassName,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { wrapClassName?: string }) {
  return (
    <div className={cx("relative", wrapClassName)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
      <input
        {...rest}
        type="search"
        className={cx(fieldClasses, fieldWidth(className), "pl-9", className)}
      />
    </div>
  );
}
