"use client";

import { cx, toneText, type Tone } from "./styles";
import { CountUp } from "./Motion";

/** Balandlik pog'onasi — `globals.css` dagi `--shadow-*` tokenlari. */
const ELEVATION = { 1: "shadow-1", 2: "shadow-2", 3: "shadow-3" } as const;

/**
 * Oddiy sirt: ramka + radius + fon. Ichki oraliqni `padded` beradi.
 *
 * @param lift — sichqoncha ostida bir pog'ona ko'tariladi. FAQAT
 *   bosiladigan yoki ochiq sahifadagi karta uchun. Jadval yonidagi
 *   ish kartasida ishlatilmaydi: u yerda harakat diqqatni oladi,
 *   foyda esa yo'q.
 * @param elevation — chuqurlik. PROP, `className` EMAS: soyani
 *   tashqaridan `shadow-2` bilan bermoqchi bo'lsangiz ishlamaydi —
 *   Card o'z sinfini ham qo'shadi va ikkitasi to'qnashadi
 *   (brauzerda o'lchangan: `shadow-2` yozilgan narx kartasi
 *   baribir 1-pog'onada chiqardi).
 */
export function Card({
  padded = true,
  lift = false,
  elevation = 1,
  className,
  children,
}: {
  padded?: boolean;
  lift?: boolean;
  elevation?: 1 | 2 | 3;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-lg border border-line bg-surface",
        ELEVATION[elevation],
        lift && "lift",
        padded && "p-5",
        className
      )}
    >
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

/* ============================================================
   ЙИҒМА ҚАТОР — БИТТА ВАРАҚ, КАТАКЛАРГА БЎЛИНГАН
   ------------------------------------------------------------
   `StatCard` ҳар бири ЎЗ рамкаси ва сояси билан келади. Учта-
   тўртта ёнма-ён турса, экраннинг тепаси «сузиб юрган қутилар»
   тўпламига айланади ва жадвалгача бўлган жой узайиб кетади.

   `SumStrip` эса БИТТА варақ: катаклар орасидаги 1px оралиқдан
   чизиқ ранги кўринади (`gap-px` + остида `bg-line`). Рамка
   битта, соя йўқ, баландлик кам — бухгалтер жадвални тезроқ
   кўради. Шакл имкониятлар варағи (bento) билан бир хил, яъни
   сайт бўйлаб битта тил.

   `StatCard` ЎЧИРИЛМАДИ: у алоҳида турадиган битта кўрсаткич
   учун ҳали ҳам тўғри шакл.
   ============================================================ */

const STRIP_COLS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

export function SumStrip({
  cols = 3,
  className,
  children,
}: {
  cols?: 2 | 3 | 4;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line",
        STRIP_COLS[cols],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Йиғма катак: ёрлиқ кичик, РАҚАМ катта, изоҳ пастда.
 *
 * @param count — берилса, янги натижа келганда рақам санаб чиқади
 *   (`format` ҳам керак). Тайёр матн учун `value`.
 */
export function SumCell({
  label,
  value,
  count,
  format,
  tone = "default",
  hint,
}: {
  label: React.ReactNode;
  value?: string;
  count?: number;
  format?: (n: number) => string;
  tone?: Tone;
  hint?: React.ReactNode;
}) {
  return (
    <div className="bg-surface px-4 py-3.5">
      <p className="truncate text-caption text-ink-3">{label}</p>
      <p className={cx("tabular mt-1 text-num font-semibold", toneText[tone])}>
        {count !== undefined && format ? <CountUp value={count} format={format} /> : value}
      </p>
      {hint && <p className="mt-1 text-caption text-ink-3">{hint}</p>}
    </div>
  );
}
