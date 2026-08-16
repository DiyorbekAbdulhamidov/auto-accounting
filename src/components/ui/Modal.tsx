"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cx } from "./styles";
import { useModule } from "./Module";

/**
 * Yagona modal oyna.
 *
 * Uch qaror:
 *  1. `<body>` ga PORTAL orqali chiqariladi. Sahifadagi kartochkalar
 *     `relative z-10` bo'lgani uchun oddiy `fixed` blok ularning
 *     ostida qolib ketardi va bosish kartochkaga tushardi (til
 *     ro'yxatida aynan shu xato bo'lgan).
 *  2. Escape va fon bosilganda yopiladi — buxgalter «qanday chiqaman»
 *     deb izlamasligi kerak.
 *  3. Ochiq turganda sahifa aylanmaydi, aks holda modal ostidagi
 *     jadval qimirlab, qaysi qatorda ekani yo'qoladi.
 */
export default function Modal({
  open,
  onClose,
  title,
  hint,
  icon,
  footer,
  width = "max-w-md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  children?: React.ReactNode;
}) {
  // Portal `<body>` da ochilgani uchun sahifadagi `data-module` unga
  // yetib bormaydi — modulni kontekstdan olib, portal ildiziga qayta
  // qo'yamiz. Aks holda kirim sverkasining modali ko'k tugма bilan
  // ochilar edi.
  // `module` деб аталмайди: Next.js буни модуль тизимининг ўзгарувчиси
  // билан адаштиради ва lint қоидаси уни таъқиқлайди.
  const moduleKind = useModule();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // `document` tekshiruvi server tomonda render bo'lganda kerak.
  // `mounted` bayrog'i ATAYLAB yo'q: u effekt ichida setState talab
  // qilardi (React 19 buni ogohlantiradi), foydasi esa yo'q — modal
  // faqat foydalanuvchi bosgandan keyin, ya'ni klientda ochiladi.
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-module={moduleKind}
      className="anim-fade fixed inset-0 z-[100] flex items-center justify-center bg-overlay p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cx(
          "anim-scale w-full rounded-lg border border-line bg-surface shadow-lg",
          width
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="flex min-w-0 items-start gap-2.5">
            {icon && <span className="mt-0.5 shrink-0 text-accent-ink">{icon}</span>}
            <div className="min-w-0">
              <h2 className="text-h3 font-semibold text-ink">{title}</h2>
              {hint && <p className="mt-1 text-caption text-ink-3">{hint}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-m-1 shrink-0 rounded-md p-1 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Ёпиш"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {children && <div className="p-5">{children}</div>}

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line p-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
