"use client";

import { cx, tableCls, toneText, type Tone } from "./styles";

/**
 * Jadval ramkasi — aylantirish (scroll) shu yerda bo'ladi.
 *
 * MUHIM: jadval HAR DOIM shu ramka ichida turadi. Aks holda 20 ustunli
 * sverka jadvali sahifani gorizontal cho'zib yuboradi va buxgalter
 * qaysi qatorda ekanini yo'qotadi.
 */
export function TableFrame({
  maxHeight,
  className,
  children,
}: {
  /** Masalan "max-h-[70vh]" — uzun ro'yxatda shapka joyida qoladi */
  maxHeight?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cx(tableCls.frame, maxHeight, className)}>{children}</div>;
}

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return <table className={cx(tableCls.table, className)}>{children}</table>;
}

export function Thead({
  sticky = false,
  className,
  children,
}: {
  sticky?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <thead className={cx(tableCls.thead, sticky && "sticky top-0 z-10", className)}>{children}</thead>
  );
}

export function Th({
  align = "left",
  sticky = false,
  width,
  className,
  children,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right" | "center";
  sticky?: boolean;
  width?: string;
}) {
  return (
    <th
      {...rest}
      className={cx(
        tableCls.th,
        align === "right" && "text-right",
        align === "center" && "text-center",
        sticky && tableCls.thSticky,
        width,
        className
      )}
    >
      {children}
    </th>
  );
}

export function Tbody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <tbody className={cx(tableCls.tbody, className)}>{children}</tbody>;
}

export function Tr({
  selected = false,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr {...rest} className={cx(tableCls.tr, selected && tableCls.trSelected, className)}>
      {children}
    </tr>
  );
}

export function Td({
  align = "left",
  main = false,
  className,
  children,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right" | "center";
  /** Qatorning asosiy ustuni (odatda nom) — matn to'q rangda */
  main?: boolean;
}) {
  return (
    <td
      {...rest}
      className={cx(
        main ? tableCls.tdMain : tableCls.td,
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}

/** Raqamli katak: o'ngda, tekis raqamlar, ma'nosiga qarab rangli. */
export function NumTd({
  tone = "default",
  strong = false,
  className,
  children,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & { tone?: Tone; strong?: boolean }) {
  return (
    <td
      {...rest}
      className={cx(tableCls.num, toneText[tone], strong && "font-semibold", className)}
    >
      {children}
    </td>
  );
}

export function Tfoot({
  sticky = false,
  className,
  children,
}: {
  sticky?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <tfoot className={cx(tableCls.tfoot, sticky && "sticky bottom-0 z-10", className)}>
      {children}
    </tfoot>
  );
}

/** Matn ichidagi rangli raqam (jadvaldan tashqarida) */
export function Num({
  tone = "default",
  strong = false,
  className,
  children,
}: {
  tone?: Tone;
  strong?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cx("tabular", toneText[tone], strong && "font-semibold", className)}>
      {children}
    </span>
  );
}

/** STIR va hujjat raqami — bir xil kenglikdagi shrift bilan */
export function Code({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "rounded-sm border border-line bg-surface-2 px-2 py-0.5 font-mono text-caption text-ink-3",
        className
      )}
    >
      {children}
    </span>
  );
}
