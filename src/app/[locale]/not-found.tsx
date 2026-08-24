// ============================================================
// 404 — SAHIFA TOPILMADI
// ------------------------------------------------------------
// Nega kerak bo'ldi (o'lchangan): `/uz/bilmadim` manzili
// Next.js ning STANDART sahifasini qaytarardi — inglizcha
// «This page could not be found», shriftsiz, rangsiz, shapkasiz
// va orqaga qaytish yo'lisiz. Sitemap Google'ga berilgani uchun
// bunday urinishlar bo'lishi aniq: eski havola, matn ichida
// buzilgan manzil, qo'lda terilgan xato.
//
// Ikki qaror:
//  1. SHAPKA VA POYABZAL bor (`PublicShell`). 404 — ko'chaning
//     oxiri emas, yo'l ko'rsatkichi: odam bu yerdan bosh
//     sahifaga ham, qo'llanmaga ham o'ta oladi.
//  2. TILNI SAQLAYDI. Manzildagi til (`/uz`, `/ru`...) shu
//     yerda ham amal qiladi — 404 birdan boshqa tilga
//     o'tib ketmaydi.
//
// Bu fayl `[locale]` ichida turadi, chunki ILDIZ MAKET aynan
// `[locale]/layout.tsx` (loyihada `src/app/layout.tsx` yo'q).
// Ya'ni bu sahifa `<html>`, shrift va til kontekstini o'sha
// maketdan oladi.
// ============================================================
"use client";

import NextLink from "next/link";
import { Compass } from "lucide-react";
import PublicShell, { PublicHeading } from "@/components/landing/PublicShell";
import { buttonClasses } from "@/components/ui";
import { useLocale, useT } from "@/context/LanguageContext";
import { path } from "@/lib/routes";

export default function NotFound() {
  const t = useT();
  const locale = useLocale();

  return (
    <PublicShell>
      <PublicHeading
        title="Саҳифа топилмади"
        lead="Бундай манзил йўқ. Ҳавола эскирган ёки манзилда хато бўлиши мумкин."
      />
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <NextLink href={path("home", locale)} className={buttonClasses("primary", "md")}>
            {t("Бош саҳифа")}
          </NextLink>
          <NextLink href={path("guide", locale)} className={buttonClasses("secondary", "md")}>
            <Compass className="h-4 w-4" />
            {t("Қўлланма")}
          </NextLink>
        </div>
      </div>
    </PublicShell>
  );
}
