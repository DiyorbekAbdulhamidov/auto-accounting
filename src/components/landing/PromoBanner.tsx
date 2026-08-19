"use client";

import { useEffect, useRef } from "react";
import { useT } from "@/context/LanguageContext";
import { promoActive } from "@/lib/plans";

// ============================================================
// OCHILISH DAVRI E'LONI
// ------------------------------------------------------------
// GIDRATATSIYA TUZOG'I. Narx sahifasi statik (SSG): u QURISH
// paytida serverda chiziladi. Agar shart to'g'ridan-to'g'ri
// `promoActive() && <div>` deb yozilsa, 1 noyabrdan oldin qurilgan
// sahifa serverda e'lonni chizadi, undan keyin ochilgan brauzer esa
// chizmaydi — server bilan klient BOSHQA HTML beradi va React butun
// sahifani qayta chizadi. 2026-08-17 da `ThemeToggle` da aynan shu
// xato bo'lgan (HANDOFF §12).
//
// Yechim o'sha yerdagi bilan bir xil: HTML HAR DOIM bir xil chiziladi,
// qaror esa gidratatsiyadan KEYIN DOM'da qo'llanadi. React holati yo'q
// — shuning uchun qayta chizish ham yo'q.
//
// Yon foydasi: davr tugaganda e'lon O'ZI yo'qoladi, qayta deploy
// kutilmaydi.
// ============================================================

export default function PromoBanner({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!promoActive()) ref.current?.setAttribute("hidden", "");
  }, []);

  const t = useT();

  return (
    <div
      ref={ref}
      className={
        "rounded-lg border border-ok/30 bg-ok-soft px-4 py-3 text-body text-ok " +
        (className || "")
      }
    >
      <b>{t("1 ноябргача ҳаммаси бепул ва чексиз.")}</b>{" "}
      <span className="text-ink-2">
        {t(
          "Карта сўралмайди — фақат рўйхатдан ўтасиз. Кейин бепул режа қайтади: 3 та корхона, сверка чексиз. Юклаган корхоналарингиз ЙЎҚОЛМАЙДИ — улар кўринишда қолади, фақат янгисини қўшиш тўхтайди."
        )}
      </span>
    </div>
  );
}
