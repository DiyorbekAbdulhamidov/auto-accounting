"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLocale, useT } from "@/context/LanguageContext";
import { path } from "@/lib/routes";
import Logo from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { Alert, Button, Field, Input, layout } from "@/components/ui";

/* ============================================================
   FORMA HECH QACHON OLDINDAN TO'LDIRILMAYDI (2026-09-30, egasi qarori)
   ------------------------------------------------------------
   Ilgari bu yerda `NEXT_PUBLIC_DEMO_EMAIL` / `NEXT_PUBLIC_DEMO_PASSWORD`
   bor edi va ko'rsatuv hisobining paroli formaga yozib qo'yilardi.
   Ikki sabab bilan OLIB TASHLANDI:

   1) `NEXT_PUBLIC_` bilan boshlangan qiymat brauzerga YUBORILADI —
      parol sahifa manbasidan o'qilardi, ya'ni MAXFIY EMAS edi.
   2) Oddiy foydalanuvchi tugmani bosib UMUMIY demo hisobga tushib
      qolardi va o'z mijozining bank ko'chirmasini o'sha yerga
      yuklashi mumkin edi.

   ATAYLAB KODDAN OLIB TASHLANDI, Vercel'dan emas. Sabab: muhit
   o'zgaruvchisi koddagi qarorni JIMGINA bekor qiladi — bu loyihada
   `NEXT_PUBLIC_SITE_URL` (saytni ikkiga bo'lgan) va o'sha demo
   paroli aynan shunday qaytib kelgan. Endi o'zgaruvchi qo'yilsa
   ham forma to'ldirilmaydi.

   Ko'rsatuv kerak bo'lsa: hisob ma'lumotini odamga QO'LDA bering.
   ============================================================ */

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

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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
