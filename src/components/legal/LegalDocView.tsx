// ============================================================
// HUQUQIY HUJJATNI KO'RSATISH
// ------------------------------------------------------------
// Matn `t()` DAN O'TMAYDI — u allaqachon til bo'yicha tanlangan
// (`src/lib/legal.ts`). Ikki marta o'girish lotin matnni yana
// transliteratsiya qilishga urinardi.
//
// Shuning uchun bu yerda `PublicHeading` ham ishlatilmaydi: u
// sarlavhani `t()` ga beradi. Ko'rinishi bir xil bo'lishi uchun
// aynan o'sha sinflar qo'lda takrorlangan.
// ============================================================
"use client";

import NextLink from "next/link";
import { useLocale, useT } from "@/context/LanguageContext";
import { localeToLang, type Lang } from "@/lib/i18n";
import { path } from "@/lib/routes";
import { MERCHANT, type LegalDoc } from "@/lib/legal";

export function LegalDocView({
  docs,
  /** Hujjat oxirida rekvizitlar ko'rsatilsinmi (ofertada — ha) */
  withDetails = false,
}: {
  docs: Record<Lang, LegalDoc>;
  withDetails?: boolean;
}) {
  const locale = useLocale();
  const t = useT();
  const doc = docs[localeToLang(locale)];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-16 md:px-6">
      <h1 className="text-title font-semibold text-ink">{doc.title}</h1>
      <p className="mt-4 text-lead text-ink-2">{doc.lead}</p>

      <div className="mt-10 space-y-8">
        {doc.sections.map((section) => (
          <section key={section.h}>
            <h2 className="text-body font-semibold text-ink">{section.h}</h2>
            <ul className="mt-3 space-y-2.5">
              {section.items.map((item, i) => (
                <li key={i} className="flex gap-3 text-body text-ink-2">
                  {/* Раqam emas, nuqta: bandlar tartibi sarlavhada
                      allaqachon bor, ikkinchi raqam chalkashtiradi. */}
                  <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {withDetails && (
        <div className="mt-10 rounded-lg border border-line bg-surface-2 p-5">
          <h2 className="text-body font-semibold text-ink">{t("Ижрочи реквизитлари")}</h2>
          <div className="mt-3">
            <MerchantDetails />
          </div>
        </div>
      )}

      {/* Uch hujjat BIRGA o'qiladi. Gapga qo'shib yozilmagan: bo'lakma-bo'lak
          tarjima qilinganda rus va ingliz tilida so'z tartibi buziladi. */}
      <nav className="mt-10 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-5 text-caption">
        <NextLink href={path("offer", locale)} className="text-ink-3 hover:text-ink hover:underline">
          {t("Оммавий оферта")}
        </NextLink>
        <NextLink href={path("refund", locale)} className="text-ink-3 hover:text-ink hover:underline">
          {t("Тўловни қайтариш")}
        </NextLink>
        <NextLink href={path("contact", locale)} className="text-ink-3 hover:text-ink hover:underline">
          {t("Алоқа ва реквизитлар")}
        </NextLink>
      </nav>
    </div>
  );
}

/**
 * REKVIZITLAR — bitta manba (`MERCHANT`).
 *
 * SHAXSIY MA'LUMOT YO'Q: F.I.Sh., ma'lumotnoma raqami, shaxsiy
 * telefon va pochta olib tashlangan. To'lov tizimi ulanganda
 * qaytariladi — pastdagi izoh aynan shuni aytadi.
 */
export function MerchantDetails() {
  const t = useT();
  const rows: { k: string; v: string; href?: string }[] = [
    { k: "Веб-хизмат", v: MERCHANT.brand },
    { k: "Веб-сайт", v: MERCHANT.site, href: `https://${MERCHANT.site}` },
    { k: "Фаолият тури", v: t("Дастурий таъминот ишлаб чиқиш") },
    { k: "Алоқа", v: MERCHANT.telegram, href: MERCHANT.telegramUrl },
  ];

  return (
    <>
    <dl className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.k} className="flex flex-wrap gap-x-3 gap-y-0.5">
          <dt className="min-w-44 text-body text-ink-3">{t(r.k)}</dt>
          <dd className="text-body text-ink">
            {r.href ? (
              <a href={r.href} className="text-accent-ink hover:underline">
                {r.v}
              </a>
            ) : (
              r.v
            )}
          </dd>
        </div>
      ))}
    </dl>
    <p className="mt-3 text-caption text-ink-3">
      {t("Тўлиқ реквизитлар тўлов тизими уланганда эълон қилинади.")}
    </p>
    </>
  );
}
