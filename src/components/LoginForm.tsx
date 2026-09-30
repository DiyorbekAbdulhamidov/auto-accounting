"use client";

import NextLink from "next/link";
import { useLocale, useT } from "@/context/LanguageContext";
import { path } from "@/lib/routes";
import Logo from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import LoginFields from "@/components/LoginFields";
import { layout } from "@/components/ui";

/* ============================================================
   `/login` SAHIFASI — ZAXIRA YO'L
   ------------------------------------------------------------
   Asosiy yo'l endi MODAL (`LoginModal`): «Кириш» bosilganda oyna
   joyida ochiladi, sahifa almashmaydi.

   Bu sahifa SAQLANADI va o'chirilmaydi, chunki:
     · `AuthContext` kirmagan odamni shu yerga yo'naltiradi
       (`router.replace(path("login"))`) — marshrut yo'q bo'lsa
       yo'naltirish hech qayerga olib bormasdi;
     · `AppShell` ham xuddi shunday qiladi;
     · havolani saqlab qo'ygan odam bo'lishi mumkin.

   Forma `LoginFields` dan chiziladi — modal bilan AYNAN bir xil
   kod. Ikki nusxa bo'lsa, biri tuzatilib ikkinchisi eskirardi.

   FORMA OLDINDAN TO'LDIRILMAYDI. Ilgari bu yerda ko'rsatuv
   hisobining paroli `NEXT_PUBLIC_DEMO_*` orqali yozib qo'yilardi —
   u brauzerga chiqardi, ya'ni maxfiy emas edi, ustiga oddiy odam
   tugmani bosib umumiy demo hisobga tushib qolardi. Koddan
   olib tashlangan, muhit o'zgaruvchisi bilan qaytmaydi.
   ============================================================ */
export default function LoginForm() {
  const t = useT();
  const locale = useLocale();

  return (
    <div className={`${layout.page} paper brand-field flex min-h-screen flex-col`}>
      <div className="flex items-center justify-between px-4 py-5 sm:px-8">
        <NextLink href={path("home", locale)} aria-label={t("Бош саҳифа")}>
          <Logo size="sm" />
        </NextLink>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-12 pt-4">
        <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-h2 font-semibold text-ink">
              {t("Кириш ёки рўйхатдан ўтиш")}
            </h1>
            <p className="mt-1.5 text-body text-ink-2">
              {t("Бухгалтер учун автоматик текширув тизими")}
            </p>
          </div>

          <LoginFields />

          {/* Qo'llanma kirish TALAB QILMAYDI: ishontirish kerak bo'lgan
              odam loginda turibdi, tizimning ichida emas. */}
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-center text-caption text-ink-3">
              <NextLink
                href={path("guide", locale)}
                className="font-medium text-accent-ink hover:underline"
              >
                {t("Тизим қандай ишлайди?")}
              </NextLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
