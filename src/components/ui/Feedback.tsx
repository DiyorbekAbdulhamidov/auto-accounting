"use client";

import { AlertTriangle, Info, CheckCircle2, Loader2 } from "lucide-react";
import { cx, toneSoft, type Tone } from "./styles";

/**
 * Ogohlantirish / xabar.
 *
 * `warn` — buxgalter tekshirishi kerak bo'lgan narsa (raqam shubhali).
 * `bad`  — ish bajarilmadi (fayl o'qilmadi, xato).
 * Ikkalasi ham YO'QOTILMAYDI: jimgina o'chirish eng qimmat xato.
 */
export function Alert({
  tone = "warn",
  title,
  className,
  children,
}: {
  tone?: "warn" | "bad" | "info" | "ok";
  title?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  const Icon = tone === "ok" ? CheckCircle2 : tone === "info" ? Info : AlertTriangle;
  return (
    <div
      className={cx(
        "flex items-start gap-2.5 rounded-md border p-3 text-caption",
        toneSoft[tone],
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(title ? "mt-0.5" : null)}>{children}</div>}
      </div>
    </div>
  );
}

/** Kichik belgi: varaq nomi, davr, holat. */
export function Badge({
  tone = "muted",
  icon,
  className,
  children,
}: {
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-caption font-medium",
        toneSoft[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Bo'sh ro'yxat. Nima yo'qligini VA nima qilish kerakligini aytadi. */
export function EmptyState({
  icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center justify-center gap-2 p-12 text-center", className)}>
      {icon && <span className="text-ink-3">{icon}</span>}
      <p className="text-body font-medium text-ink-2">{title}</p>
      {hint && <p className="max-w-sm text-caption text-ink-3">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx("h-4 w-4 animate-spin", className)} />;
}

/* ============================================================
   YUKLANISH — EKRANNING O'Z SHAKLI
   ------------------------------------------------------------
   Ilgari bo'sh sahifa o'rtasida kichkina aylanma turardi. Uning
   ikkita kamchiligi bor edi: ekran BO'SH ko'rinardi va nima
   kelishini aytmasdi — odam kutayotganini bilardi, lekin NIMANI
   kutayotganini bilmasdi.

   Endi joy EGALLANADI: jadval shapkasi va qatorlar o'rni darhol
   chiziladi. Ma'lumot kelganda sahifa SILJIMAYDI, chunki o'lcham
   avvaldan to'g'ri — bu «layout shift» ni ham yo'q qiladi.
   ============================================================ */

/** Bitta bo'sh joy. O'lchamni CHAQIRUVCHI beradi — bu yerda
 *  «universal» o'lcham yo'q, chunki har ustunning kengligi boshqa. */
export function Skeleton({ className }: { className?: string }) {
  return <span className={cx("skeleton block", className)} />;
}

/**
 * Ko'rsatkich qatori — uchta katak.
 * Haqiqiy `StatCard` bilan AYNAN bir xil o'lchamda bo'lishi shart.
 */
export function StatRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-lg border border-line bg-surface p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-6 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Jadval: shapka + qatorlar. Ustun soni haqiqiysi bilan bir xil. */
export function TableSkeleton({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div
        className="flex items-center gap-4 border-b border-line bg-surface-2 px-4 py-2.5"
        aria-hidden="true"
      >
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className={cx("h-3", i === 0 ? "w-40 flex-1" : "w-20")} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0">
          {Array.from({ length: cols }, (_, i) => (
            <Skeleton key={i} className={cx("h-3.5", i === 0 ? "w-48 flex-1" : "w-16")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Butun sahifa yuklanayotgani — ISH stolining shakli bilan.
 *
 * @param shape — `"table"` ish sahifalari uchun (ko'rsatkich +
 *   jadval), `"plain"` esa hali hech narса ma'lum bo'lmaganda
 *   (masalan xavfsizlik tekshiruvi): bunda faqat brend va
 *   noaniq yo'lak turadi.
 */
export function PageLoader({
  text,
  shape = "plain",
  cols = 5,
}: {
  text: string;
  shape?: "plain" | "table";
  cols?: number;
}) {
  if (shape === "table") {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6" aria-busy="true">
        <span className="sr-only">{text}</span>
        <Skeleton className="h-7 w-56" />
        <div className="mt-6">
          <StatRowSkeleton />
        </div>
        <div className="mt-6">
          <TableSkeleton cols={cols} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-6 text-ink"
      aria-busy="true"
    >
      <div className="w-full max-w-xs">
        <div className="progress-track rounded-full" />
      </div>
      <p className="text-body text-ink-3">{text}</p>
    </div>
  );
}

/**
 * ТСС қатори — БОСИБ ОЧИЛАДИ.
 *
 * `<details>`/`<summary>` атайлаб: очиқ-ёпиқ ҳолат браузернинг
 * ЎЗИДА туради, яъни React ҳолати ҳам, гидратация фарқи ҳам йўқ.
 * Клавиатура ва экран ўқувчи ҳам буни ўзи билади.
 *
 * ЖАВОБ МАТНИ DOM'да ҲАР ДОИМ ТУРАДИ, фақат кўринмайди —
 * `FAQPage` разметкаси саҳифадаги матнга мос келиши шарт, акс
 * ҳолда Google уни рад этади.
 *
 * Битта манба: бош саҳифа, қўлланма ва нарх саҳифаси — учаласи
 * шу қаторни ишлатади.
 */
export function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-line last:border-0">
      <summary className="flex cursor-pointer list-none items-start gap-3 py-3.5 text-body font-medium text-ink">
        <span className="flex-1">{q}</span>
        {/* «+» очилганда 45° айланиб «×» бўлади — иккита белги
            чизилмайди, битта белги ҳолатни айтади */}
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-45"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M8 3v10" />
          <path d="M3 8h10" />
        </svg>
      </summary>
      <p className="faq-body pb-4 pr-7 text-body text-ink-2">{children}</p>
    </details>
  );
}
