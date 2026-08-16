"use client";

import { cx } from "@/components/ui";

/**
 * Qo'llanma uchun «qizil bilan chizilgan» belgilar.
 *
 * NEGA SKRINSHOT EMAS. Odatda bunday qo'llanma ekran rasmiga qizil
 * o'q chizib qilinadi. Bu yerda ataylab boshqacha: ko'rsatiladigan
 * narsa — dasturning HAQIQIY komponentlari, ustiga belgi qo'yilgan.
 * Uch sabab:
 *   1. Rasm eskiradi. Ustun nomi o'zgarishi bilan qo'llanma yolg'on
 *      bo'lib qoladi va buni hech kim sezmaydi. Tirik mok esa
 *      komponent bilan birga o'zgaradi.
 *   2. Tilda qotib qoladi. Dasturda 4 ta til bor, rasm esa bittasida.
 *      Bu yerdagi matn `t()` orqali o'tadi.
 *   3. Tungi rejim. Rasm ikkisidan birida noto'g'ri ko'rinadi,
 *      tokenli mok esa ikkalasida ham to'g'ri.
 */

/** Raqamli qizil belgi — «shu yerga qarang» */
export function Marker({ n, className }: { n: number; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
        "bg-mark text-caption font-semibold text-white tabular",
        className
      )}
      aria-hidden
    >
      {n}
    </span>
  );
}

/**
 * Qizil uzuq chiziq bilan o'ralgan joy — bosiladigan/qaraladigan element.
 * `label` — chetdagi izoh, «nima qilish kerak».
 */
export function Highlight({
  n,
  label,
  className,
  children,
}: {
  n?: number;
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("relative rounded-md outline-2 outline-dashed outline-mark", className)}>
      {n !== undefined && (
        <Marker n={n} className="absolute -left-2 -top-2 z-10 ring-2 ring-surface" />
      )}
      {children}
      {label && (
        <span className="absolute -bottom-2 right-2 z-10 rounded-sm bg-mark px-1.5 py-0.5 text-caption font-medium text-white">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Dastur ekranining kichik nusxasi.
 *
 * Brauzer oynasiga o'xshatilgan ramka — foydalanuvchi «bu rasm, dastur
 * emas» ekanini darhol tushunsin. Aks holda qo'llanmadagi tugmani
 * bosishga urinadi.
 */
export function MockFrame({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("overflow-hidden rounded-lg border border-line bg-surface", className)}>
      <div className="flex items-center gap-1.5 border-b border-line bg-surface-2 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="ml-1.5 truncate text-caption text-ink-3">{title}</span>
      </div>
      {/* Mok ичидаги ҳеч нарса босилмайди — қўлланма интерактив эмас */}
      <div className="pointer-events-none select-none p-4">{children}</div>
    </div>
  );
}

/** Qadam: raqam, sarlavha, matn va yonida moki */
export function Step({
  n,
  title,
  children,
  mock,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  mock: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
      <div>
        <div className="flex items-center gap-2.5">
          <Marker n={n} />
          <h3 className="text-h3 font-semibold text-ink">{title}</h3>
        </div>
        <div className="mt-2 space-y-2 text-body text-ink-2">{children}</div>
      </div>
      <div>{mock}</div>
    </div>
  );
}
