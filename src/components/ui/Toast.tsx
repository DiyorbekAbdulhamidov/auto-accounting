// ============================================================
// XABAR (toast) — `alert()` ning o'rniga
// ------------------------------------------------------------
// Nega kerak bo'ldi: kodda 13 ta `window.alert()` bor edi. Brauzer
// alerti dizayn tizimidan TASHQARIDA turadi, tarjima qilinmaydi,
// tungi rejimni bilmaydi va butun sahifani BLOKLAYDI — buxgalter
// «OK» bosmaguncha jadval bilan ishlay olmaydi.
//
// Kutubxona: `sonner`. O'zimiz yozmaganimizning sababi — navbat,
// klaviatura fokusi, `aria-live` va harakatni kamaytirish sozlamasi
// hammasi to'g'ri qilingan; ularni qaytadan yozish xatoni ko'paytiradi.
//
// IKKITA O'LCHANGAN TUZOQ:
//
// 1) O'LCHAMGA tegadigan sinf berilmaydi. Sonner balandlikni MONTAJDA
//    o'lchaydi va shu bilan qatorlarni joylashtiradi; shrift yoki
//    oraliq keyin o'zgarsa hisob eskiradi. Shuning uchun quyida
//    faqat RANG beriladi — o'lcham sonner'niki bo'lib qoladi.
//
// 2) Izoh matni (`data-description`) sonner'ning O'Z kulrangida
//    chiziladi va u CSS o'zgaruvchidan OLINMAYDI. Tungi rejimda
//    o'lchandi: rgb(63,63,63) ustida rgb(17,24,39) fon =
//    **1,68:1** — o'qib bo'lmaydi. Tuzatma  da:
//    Tailwind sinfi (0,1,0) sonner'ning atribut selektorini (0,2,0)
//    yenga olmadi, shuning uchun u yerda uch darajali qoida bor.
// ============================================================
"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

/** Ilova ildizida BIR MARTA chiziladi (`app/[locale]/layout.tsx`). */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      // `richColors` YO'Q: u sonner'ning o'z rang palitrasini yoqadi va
      // dizayn tizimidagi `--ok` / `--bad` / `--warn` bilan to'qnashadi.
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--ink)",
          "--normal-border": "var(--line)",
          "--success-bg": "var(--ok-soft)",
          "--success-text": "var(--ok)",
          "--success-border": "var(--ok)",
          "--error-bg": "var(--bad-soft)",
          "--error-text": "var(--bad)",
          "--error-border": "var(--bad)",
          "--warning-bg": "var(--warn-soft)",
          "--warning-text": "var(--warn)",
          "--warning-border": "var(--warn)",
        } as React.CSSProperties
      }
    />
  );
}

/**
 * Xabar chiqarish.
 *
 * `alert()` dan farqi: sahifani bloklamaydi va o'zi yo'qoladi.
 * Shuning uchun MUHIM xabar (ish bajarilmadi) uzoqroq turadi —
 * buxgalter uni ko'rmay qolmasligi kerak.
 */
export const notify = {
  ok: (text: string, description?: string) =>
    sonnerToast.success(text, { description, duration: 3000 }),
  /** Ish BAJARILMADI. Eng uzun muddat: bu xabar yo'qolib ketmasin. */
  error: (text: string, description?: string) =>
    sonnerToast.error(text, { description, duration: 8000 }),
  /** Tekshirish kerak, lekin ish to'xtamadi */
  warn: (text: string, description?: string) =>
    sonnerToast.warning(text, { description, duration: 6000 }),
  info: (text: string, description?: string) =>
    sonnerToast(text, { description, duration: 4000 }),
};
