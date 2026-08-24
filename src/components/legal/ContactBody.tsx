"use client";

import NextLink from "next/link";
import { Send, Clock } from "lucide-react";
import { useLocale, useT } from "@/context/LanguageContext";
import { path } from "@/lib/routes";
import { MERCHANT } from "@/lib/legal";
import { MerchantDetails } from "./LegalDocView";

/**
 * Aloqa sahifasining tanasi.
 *
 * Ikki qism ATAYLAB ajratilgan: yuqorida ODAM nima qilishi kerakligi
 * (yozish yo'llari va qachon javob keladi), pastda RASMIY rekvizitlar.
 * Aralashtirilsa, yordam so'ramoqchi bo'lgan buxgalter hujjat ichidan
 * telefon qidirib qoladi.
 */
export function ContactBody() {
  const t = useT();
  const locale = useLocale();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 md:px-6">
      {/* Yagona kanal: shaxsiy telefon va pochta saytdan olib tashlangan */}
      <a
        href={MERCHANT.telegramUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-accent"
      >
        <Send className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" />
        <span className="min-w-0">
          <span className="block text-caption text-ink-3">{t("Телеграм")}</span>
          <span className="block truncate text-body font-medium text-ink">
            {MERCHANT.telegram}
          </span>
        </span>
      </a>

      <div className="mt-4 flex items-start gap-3 rounded-lg border border-line bg-surface-2 p-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" />
        <div>
          <p className="text-body text-ink">
            {t("Иш вақти: душанба–жума, 9:00–18:00 (Тошкент вақти).")}
          </p>
          <p className="mt-1 text-caption text-ink-3">
            {t(
              "Хабарларга бир иш куни ичида жавоб берилади. Тўловни қайтариш аризаси 3 иш кунида кўрилади."
            )}
          </p>
        </div>
      </div>

      <h2 className="mt-10 text-body font-semibold text-ink">{t("Расмий реквизитлар")}</h2>
      <div className="mt-3 rounded-lg border border-line bg-surface p-5">
        <MerchantDetails />
      </div>

      <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-caption">
        <NextLink href={path("offer", locale)} className="text-ink-3 hover:text-ink hover:underline">
          {t("Оммавий оферта")}
        </NextLink>
        <NextLink href={path("refund", locale)} className="text-ink-3 hover:text-ink hover:underline">
          {t("Тўловни қайтариш")}
        </NextLink>
      </nav>
    </div>
  );
}
