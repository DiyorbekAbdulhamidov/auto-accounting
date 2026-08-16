"use client";

import { cx } from "./styles";

/**
 * Yorliqli belgi qutisi.
 *
 * `hint` — nima uchun bu yerda turganini tushuntiradi. Buxgalter
 * «имзо кутилаётган фактура» ni hisoblash-hisoblamaslikni bilishi
 * kerak, shuning uchun izoh bezak emas, qarorning bir qismi.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  hint,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  hint?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cx(
        "flex w-fit cursor-pointer select-none items-start gap-2.5 text-body text-ink-2",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-accent"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        {label}
        {hint && <span className="text-ink-3"> {hint}</span>}
      </span>
    </label>
  );
}

/** Jadval qatoridagi yalang'och belgi qutisi (yorliqsiz) */
export function RowCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  /** Ekran o'qiydigan dastur uchun — vizual ko'rinmaydi */
  label: string;
}) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 cursor-pointer accent-accent"
      checked={checked}
      onChange={onChange}
      aria-label={label}
    />
  );
}
