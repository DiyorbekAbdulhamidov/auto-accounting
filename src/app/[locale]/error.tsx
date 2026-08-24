// ============================================================
// KUTILMAGAN XATOLIK
// ------------------------------------------------------------
// Nega kerak bo'ldi: bu fayl bo'lmasa React'ning xato chegarasi
// ishlab chiqarishda BO'SH ekran («Application error») beradi.
// Buxgalter uchun bu eng yomon holat — u sverka o'rtasida
// turibdi, ekran o'chdi, nima bo'lganini ham, endi nima
// qilishni ham bilmaydi.
//
// Uch qaror:
//
//  1. QAYTA URINISH bor. Next 16 da bu `unstable_retry()`:
//     u ma'lumotni QAYTA OLADI va faqat shu qismni qayta
//     chizadi — butun sahifani yangilash shart emas, ya'ni
//     yuklangan fayl va tanlovlar joyida qoladi.
//     (`reset()` ham bor, lekin u ma'lumotni qayta olmaydi —
//     hujjat aynan shu holat uchun `unstable_retry` ni
//     tavsiya qiladi.)
//
//  2. RAQAMLAR YO'QOLMAGANI AYTILADI. Sverka faqat SAQLANGANDA
//     bazaga tushadi; xato hisobni buzmaydi. Odam «hammasi
//     ketdi» deb qo'rqmasligi kerak.
//
//  3. XATO RAQAMI (`digest`) ko'rsatiladi. Serverdagi xatoning
//     matni klientga ATAYLAB yuborilmaydi (Next shunday
//     qiladi — matn ichida maxfiy ma'lumot bo'lishi mumkin),
//     lekin `digest` jurnaldagi yozuv bilan bog'lanadi. Odam
//     shu qisqa raqamni yozib yuborsa — sabab topiladi.
// ============================================================
"use client";

import { useEffect } from "react";
import NextLink from "next/link";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui";
import { useLocale, useT } from "@/context/LanguageContext";
import { path } from "@/lib/routes";

export default function ErrorBoundary({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useT();
  const locale = useLocale();

  useEffect(() => {
    // Konsolda TO'LIQ matn qoladi: nosozlikni qidirganda kerak.
    console.error("Kutilmagan xatolik:", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 px-4 py-24 md:px-6">
      <span className="text-bad">
        <TriangleAlert className="h-8 w-8" />
      </span>
      <h1 className="text-title font-semibold text-ink">{t("Кутилмаган хатолик")}</h1>
      <p className="text-lead text-ink-2">
        {t("Саҳифани чизишда хато чиқди. Сақланган ҳисоботларингиз ва рақамларингиз жойида — хато ҳисобга тегмайди.")}
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button variant="primary" onClick={() => unstable_retry()} icon={<RotateCw className="h-4 w-4" />}>
          {t("Қайта уриниш")}
        </Button>
        <NextLink href={path("clients", locale)} className={buttonClasses("secondary", "md")}>
          {t("Корхоналар")}
        </NextLink>
      </div>

      {error.digest && (
        <p className="pt-2 text-caption text-ink-3">
          {t("Хато рақами")}: <span className="tabular">{error.digest}</span>
        </p>
      )}
    </div>
  );
}
