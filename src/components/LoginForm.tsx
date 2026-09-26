"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLocale, useT } from "@/context/LanguageContext";
import { path } from "@/lib/routes";
import Logo from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { Alert, Badge, Button, Field, Input, layout } from "@/components/ui";

/* ============================================================
   KO'RSATUV (DEMO) HISOBI — FORMA OLDINDAN TO'LDIRILADI
   ------------------------------------------------------------
   Hakam yoki mijoz saytni ochganda ro'yxatdan o'tmasdan ichkariga
   kira olishi kerak. Qiymat muhit o'zgaruvchisidan olinadi:

     NEXT_PUBLIC_DEMO_PHONE
     NEXT_PUBLIC_DEMO_PASSWORD

   ⚠️ XAVFSIZLIK — ochiq aytiladi. `NEXT_PUBLIC_` bilan boshlangan
   har qanday qiymat brauzerga YUBORILADI va uni sahifa manbasidan
   o'qish mumkin. Ya'ni bu yerga qo'yilgan parol MAXFIY EMAS.
   Shuning uchun bu yerga ASOSIY hisob emas, ALOHIDA ko'rsatuv
   hisobi qo'yilishi kerak: o'z ish maydoni, o'ylab topilgan namuna
   ma'lumoti bilan (`demo/make-demo.cjs` shuni tayyorlaydi).
   Aks holda saytni ochgan har kim haqiqiy mijoz ma'lumotiga
   to'liq kira oladi — va uni O'ZGARTIRA ham oladi, chunki kodda
   «faqat o'qish» rejimi yo'q.

   IKKALA NOM HAM ISHLAYDI. `NEXT_PUBLIC_DEMO_PHONE` — yangisi;
   topilmasa ESKI `NEXT_PUBLIC_DEMO_EMAIL` ga tushadi. Sabab ANIQ:
   hakamlarga berilgan havola (`test-project.webleaders.uz/en`)
   ishlashdan TO'XTAMASLIGI kerak. Vercel'da hozir eski o'zgaruvchi
   turibdi — u almashtirilgunga qadar ham kirish uzilmaydi.
   `AuthContext.phoneAccess()` `@` bo'lsa uni email deb qabul qiladi.
   ============================================================ */
const IS_DEV = process.env.NODE_ENV === "development";

const DEMO_PHONE =
  process.env.NEXT_PUBLIC_DEMO_PHONE ||
  process.env.NEXT_PUBLIC_DEMO_EMAIL ||
  (IS_DEV ? "90 123 45 67" : "");
const DEMO_PASSWORD =
  process.env.NEXT_PUBLIC_DEMO_PASSWORD || (IS_DEV ? "12345678" : "");

/** Forma oldindan to'ldirilganmi — ekranda buni AYTISH kerak, aks
 *  holda odam «nega mening maydonlarim to'la?» deb hayron bo'ladi. */
const PREFILLED = Boolean(DEMO_PHONE && DEMO_PASSWORD);

/* ============================================================
   KIRISH — BITTA AMAL
   ------------------------------------------------------------
   «Рўйхатдан ўтиш» va «Кириш» tushunchalari OLIB TASHLANDI.
   Sabab: buxgalter uchun bu ikkisi bir xil harakat — u raqamini
   va parolini yozadi va ichkariga kiradi. Raqam tanish bo'lsa
   kiradi, bo'lmasa hisob ochiladi. Bu qaror `AuthContext`
   `phoneAccess()` ichida bajariladi, ekranda esa BITTA tugma.

   SMS TASDIQLASH YO'Q — egasi qarori (2026-09-26). Buning narxi
   ochiq aytilgan: raqam kimniki ekani tekshirilmaydi, ya'ni
   istalgan odam istalgan raqam bilan hisob ocha oladi. Izoh
   `src/lib/phone.ts` da (`phoneToAuthEmail`).
   ============================================================ */
export default function LoginForm() {
  const t = useT();
  const locale = useLocale();
  const { phoneAccess } = useAuth();

  const [phone, setPhone] = useState(DEMO_PHONE);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const message = await phoneAccess(phone, password);
    setIsSubmitting(false);
    if (message) setError(message);
    // Muvaffaqiyatda AuthContext o'zi mijozlar sahifasiga o'tkazadi
  };

  return (
    /* ============================================================
       MODAL KO'RINISHI
       ------------------------------------------------------------
       Yangi UI QADAM qo'shilmadi: manzil hamon `/login`, faqat
       forma qorong'ulashgan fon ustidagi oynada turadi. Shunday
       qilingani uchun `AuthContext` dagi yo'naltirishlar
       (`router.replace(path("login"))`) o'zgarishsiz ishlaydi.
       ============================================================ */
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

      {/* Qorong'u fon — oyna his qilinishi uchun */}
      <div className="flex flex-1 items-center justify-center bg-ink/20 px-4 pb-12 pt-4 backdrop-blur-[2px]">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-title"
          className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-xl"
        >
          <div className="mb-6">
            <h1 id="login-title" className="text-h2 font-semibold text-ink">
              {t("Тизимга кириш")}
            </h1>
            <p className="mt-1.5 text-body text-ink-2">
              {t("Бухгалтер учун автоматик текширув тизими")}
            </p>
          </div>

          {PREFILLED && (
            <Badge tone="info" className="mb-4">
              {t("Кўрсатув учун маълумотлар олдиндан тўлдирилган — «Тизимга кириш»ни босинг")}
            </Badge>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field
              label={t("Телефон рақами")}
              htmlFor="phone"
              hint={t("+998 автоматик қўшилади")}
            >
              <Input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                inputMode="tel"
                placeholder="90 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>

            <Field label={t("Парол")} htmlFor="password" hint={t("Камида 6 та белги")}>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </Field>

            {error && <Alert tone="bad">{t(error)}</Alert>}

            <Button type="submit" variant="primary" block loading={isSubmitting}>
              {isSubmitting ? t("Текширилмоқда...") : t("Тизимга кириш")}
            </Button>
          </form>

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
