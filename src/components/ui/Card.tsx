"use client";

import { cx, toneText, type Tone } from "./styles";
import { CountUp } from "./Motion";

/** Oddiy sirt: ramka + radius + fon. Ichki oraliqni `padded` beradi. */
export function Card({
  padded = true,
  className,
  children,
}: {
  padded?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("rounded-lg border border-line bg-surface", padded && "p-5", className)}>
      {children}
    </div>
  );
}

/** Karta sarlavhasi: chapda nom va izoh, o'ngda tugmalar. */
export function CardHeader({
  title,
  hint,
  icon,
  actions,
  className,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && <div className="mt-0.5 shrink-0 text-ink-3">{icon}</div>}
        <div className="min-w-0">
          <h2 className="text-h3 font-semibold text-ink">{title}</h2>
          {hint && <p className="mt-1 text-caption text-ink-3">{hint}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * Ko'rsatkich kartasi.
 *
 * Raqam eng katta element bo'ladi — buxgalter ekranga qaraganda birinchi
 * ko'radigan narsa summa bo'lishi kerak, yorliq emas.
 */
export function StatCard({
  label,
  value,
  count,
  format,
  unit,
  hint,
  tone = "default",
  icon,
  className,
}: {
  label: string;
  /** Tayyor matn. `count` berilsa e'tiborga olinmaydi. */
  value?: string;
  /** Raqamni bersangiz — yangi natija kelganda sanalib chiqadi.
   *  Faqat YIG'MA ko'rsatkich uchun; jadval katagida ishlatilmaydi. */
  count?: number;
  format?: (n: number) => string;
  unit?: string;
  hint?: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("rounded-lg border border-line bg-surface p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-caption font-medium text-ink-3">{label}</p>
        {icon && <span className={cx("shrink-0", toneText[tone])}>{icon}</span>}
      </div>
      <p className={cx("mt-2 text-num font-semibold tabular", toneText[tone])}>
        {count !== undefined && format ? <CountUp value={count} format={format} /> : value}
        {unit && <span className="ml-1.5 text-caption font-medium text-ink-3">{unit}</span>}
      </p>
      {hint && <p className="mt-1.5 text-caption text-ink-3">{hint}</p>}
    </div>
  );
}
