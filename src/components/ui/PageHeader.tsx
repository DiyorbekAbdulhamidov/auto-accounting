"use client";

import NextLink from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonClasses, cx } from "./styles";

/**
 * Sahifa sarlavhasi — hamma sahifada bir xil joyda va bir xil tartibda:
 *   [orqaga]  Nom
 *             bir qatorli tushuntirish            [amallar]
 *
 * Tushuntirish ATAYLAB majburiy: buxgalter sahifaga tushganda
 * «bu qaysi tomon — kirimmi, chiqimmi» degan savol qolmasligi kerak.
 *
 * TIL va TEMA tugmalari bu yerda EMAS — ular yuqoridagi ilova
 * qatorida (`app/korxonalar/layout.tsx`), ya'ni ekranда bir marta.
 * Ilgari ikkalasi ham chiqib, bir sahifada ikki marta turardi.
 */
export default function PageHeader({
  title,
  description,
  backHref,
  actions,
  className,
}: {
  title: React.ReactNode;
  description: string;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {backHref && (
          <NextLink
            href={backHref}
            aria-label="Орқага"
            className={cx(buttonClasses("secondary", "md", { iconOnly: true }), "mt-0.5")}
          >
            <ArrowLeft className="h-4 w-4" />
          </NextLink>
        )}
        <div className="min-w-0">
          <h1 className="text-h1 font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-1 text-body text-ink-2">{description}</p>
        </div>
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
