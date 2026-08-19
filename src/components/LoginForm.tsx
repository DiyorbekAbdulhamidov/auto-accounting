"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLocale, useT } from "@/context/LanguageContext";
import { path } from "@/lib/routes";
import { formatPhone, toE164 } from "@/lib/phone";
import Logo from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { Alert, Badge, Button, Card, Field, Input, layout } from "@/components/ui";

/* ============================================================
   KO'RSATUV (DEMO) HISOBI — FORMA OLDINDAN TO'LDIRILADI
   ------------------------------------------------------------
   Ilgari bu FAQAT `NODE_ENV === "development"` da ishlardi va
   qurilmadan butunlay olib tashlanardi. Deploy qilingan saytda
   maydonlar BO'SH chiqardi — ya'ni hakam yoki mijozga ko'rsatishda
   foyda bermasdi.

   Endi qiymat muhit o'zgaruvchisidan olinadi:

     NEXT_PUBLIC_DEMO_EMAIL
     NEXT_PUBLIC_DEMO_PASSWORD

   Qo'yilmasa — ishlab chiqish rejimida eski sinov hisobiga qaytadi,
   ishlab chiqarishda esa to'ldirish UMUMAN bo'lmaydi.

   ⚠️ XAVFSIZLIK — ochiq aytiladi. `NEXT_PUBLIC_` bilan boshlangan
   har qanday qiymat brauzerga YUBORILADI va uni sahifa manbasidan
   o'qish mumkin. Ya'ni bu yerga qo'yilgan parol MAXFIY EMAS.
   Shuning uchun bu yerga ASOSIY (superadmin) hisob emas, ALOHIDA
   ko'rsatuv hisobi qo'yilishi kerak: o'z ish maydoni, o'z namuna
   ma'lumoti bilan. Aks holda saytni ochgan har kim haqiqiy mijoz
   ma'lumotiga to'liq kira oladi.
   ============================================================ */
const IS_DEV = process.env.NODE_ENV === "development";

const DEMO_EMAIL =
  process.env.NEXT_PUBLIC_DEMO_EMAIL || (IS_DEV ? "webleaders.uz@gmail.com" : "");
const DEMO_PASSWORD =
  process.env.NEXT_PUBLIC_DEMO_PASSWORD || (IS_DEV ? "12345678" : "");

/** Forma oldindan to'ldirilganmi — ekranda buni AYTISH kerak, aks
 *  holda odam «nega mening maydonlarim to'la?» deb hayron bo'ladi. */
const PREFILLED = Boolean(DEMO_EMAIL && DEMO_PASSWORD);

/* ============================================================
   KIRISH USULI
   ------------------------------------------------------------
   ASOSIYSI — EMAIL VA PAROL. U ishonchli ishlaydi va hech qanday
   tashqi shartga bog'liq emas.

   TELEFON (SMS) ikkinchi yo'l bo'lib qoldi. Sabab texnik: haqiqiy
   SMS yuborish Firebase'ning Blaze (pulli) rejasini talab qiladi
   (`auth/billing-not-enabled`), sinov raqamlari esa faqat sinash
   uchun. Blaze yoqilgandan keyin ikkalasining o'rnini almashtirish —
   quyidagi `useState<Step>` ning boshlang'ich qiymatini o'zgartirish,
   boshqa hech narsa.

   Telefonda RO'YXATDAN O'TISH / KIRISH farqi YO'Q: Firebase raqamni
   birinchi ko'rganda hisobni o'zi ochadi.
   ============================================================ */
type Step = "phone" | "code" | "email";

export default function LoginForm() {
  const t = useT();
  const locale = useLocale();
  const { login, signup, resetPassword, sendSmsCode, confirmSmsCode } = useAuth();

  // Boshlang'ich qadam — EMAIL (yuqoridagi izohga qara)
  const [step, setStep] = useState<Step>("email");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Telefon
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  /** Kod yuborilgan raqam — ekranda ko'rsatiladi, tahrirlanmaydi */
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Email — ASOSIY yo'l
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [emailMode, setEmailMode] = useState<"login" | "signup">("login");
  /** Parolni tiklash xati yuborilgani — xato emas, shuning uchun alohida */
  const [resetSent, setResetSent] = useState(false);

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const e164 = toE164(phone);
    if (!e164) {
      // Tekshiruv KLIENTDA ham qilinadi: noto'g'ri raqam bilan
      // Firebase'ga borish kvotani behuda yeydi va xatosi tushunarsiz.
      setError(t("Телефон рақами нотўғри. Мисол: 90 123 45 67"));
      return;
    }
    setIsSubmitting(true);
    const message = await sendSmsCode(e164);
    setIsSubmitting(false);
    if (message) {
      setError(message);
      return;
    }
    setSentTo(e164);
    setCode("");
    setStep("code");
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const message = await confirmSmsCode(code.trim());
    setIsSubmitting(false);
    if (message) setError(message);
    // Muvaffaqiyatda AuthContext o'zi mijozlar sahifasiga o'tkazadi
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    if (emailMode === "signup") {
      const message = await signup(email, password);
      if (message) setError(message);
    } else {
      await login(email, password);
    }
    setIsSubmitting(false);
  };


  /**
   * Parolni tiklash. Email maydoni TO'LDIRILGAN bo'lishi shart —
   * alohida oyna ochilmaydi: qadam qo'shmaslik qoidasi.
   */
  const handleReset = async () => {
    setError(null);
    setResetSent(false);
    if (!email.trim()) {
      setError(t("Аввал email манзилни ёзинг."));
      return;
    }
    setIsSubmitting(true);
    const message = await resetPassword(email.trim());
    setIsSubmitting(false);
    if (message) setError(message);
    else setResetSent(true);
  };

  const title =
    step === "code"
      ? t("SMS кодни киритинг")
      : step === "phone"
        ? t("Телефон рақами билан кириш")
        : emailMode === "signup"
          ? t("Рўйхатдан ўтиш")
          : t("Тизимга кириш");

  const subtitle =
    step === "code"
      ? `${t("Код юборилди")}: ${sentTo ? formatPhone(sentTo) : ""}`
      : step === "phone"
        ? t("Телефон рақамингизни киритинг — парол керак эмас")
        : t("Бухгалтер учун автоматик текширув тизими");

  return (
    <div className={`${layout.page} relative flex items-center justify-center overflow-hidden px-4`}>
      {/* Фон — бош саҳифадаги АЙНАН ўша тўр ва нурланиш. */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 0%, color-mix(in srgb, var(--brand-out) 16%, transparent) 0%, transparent 70%), " +
            "radial-gradient(50% 50% at 50% 100%, color-mix(in srgb, var(--brand-in) 16%, transparent) 0%, transparent 70%)",
        }}
      />

      <NextLink
        href={path("home", locale)}
        className="absolute left-4 top-4 z-10"
        aria-label={t("Бош саҳифа")}
      >
        <Logo size="sm" />
      </NextLink>
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <Card elevation={3} className="relative z-10 w-full max-w-sm rounded-xl p-6">
        <div className="mb-6">
          <h1 className="text-h2 font-semibold text-ink">{title}</h1>
          <p className="mt-1.5 text-body text-ink-2">{subtitle}</p>
        </div>

        {PREFILLED && step === "email" && (
          <Badge tone="info" className="mb-4">
            {t("Кўрсатув учун маълумотлар олдиндан тўлдирилган — «Тизимга кириш»ни босинг")}
          </Badge>
        )}

        {/* ---------- 1) ТЕЛЕФОН ---------- */}
        {step === "phone" && (
          <form className="space-y-4" onSubmit={handleSendSms}>
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

            {error && <Alert tone="bad">{t(error)}</Alert>}

            <Button type="submit" variant="primary" block loading={isSubmitting}>
              {isSubmitting ? t("Юборилмоқда...") : t("SMS код олиш")}
            </Button>
          </form>
        )}

        {/* ---------- 2) SMS КОД ---------- */}
        {step === "code" && (
          <form className="space-y-4" onSubmit={handleConfirm}>
            <Field label={t("SMS код")} htmlFor="code">
              <Input
                id="code"
                type="text"
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>

            {error && <Alert tone="bad">{t(error)}</Alert>}

            <Button type="submit" variant="primary" block loading={isSubmitting}>
              {isSubmitting ? t("Текширилмоқда...") : t("Кириш")}
            </Button>

            {/* Рақамни ЎЗГАРТИРИШ йўли шарт: одам хато ёзган бўлса,
                саҳифани янгилашга мажбур қилиш керак эмас. */}
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setError(null);
                setCode("");
              }}
              className="block w-full text-center text-caption font-medium text-accent-ink hover:underline"
            >
              {t("Рақамни ўзгартириш")}
            </button>
          </form>
        )}

        {/* ---------- 3) EMAIL (ЗАХИРА) ---------- */}
        {step === "email" && (
          <form className="space-y-4" onSubmit={handleEmail}>
            <Field label={t("Email манзил")} htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@firma.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field
              label={t("Парол")}
              htmlFor="password"
              hint={emailMode === "signup" ? t("Камида 6 та белги") : undefined}
            >
              <Input
                id="password"
                type="password"
                required
                autoComplete={emailMode === "signup" ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={emailMode === "signup" ? 6 : undefined}
              />
            </Field>

            {error && <Alert tone="bad">{t(error)}</Alert>}
            {resetSent && (
              <Alert tone="ok">
                {t("Тиклаш ҳаволаси юборилди. Почтангизни (ва «Спам» папкасини) текширинг.")}
              </Alert>
            )}

            <Button type="submit" variant="primary" block loading={isSubmitting}>
              {isSubmitting
                ? t("Текширилмоқда...")
                : emailMode === "signup"
                  ? t("Бепул бошлаш")
                  : t("Тизимга кириш")}
            </Button>

            {emailMode === "login" && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="block w-full text-center text-caption text-ink-3 hover:text-ink-2 hover:underline disabled:opacity-50"
              >
                {t("Паролни унутдингизми?")}
              </button>
            )}

            <p className="text-center text-caption text-ink-3">
              {emailMode === "signup" ? t("Аллақачон ҳисобингиз борми?") : t("Ҳисобингиз йўқми?")}{" "}
              <button
                type="button"
                onClick={() => {
                  setEmailMode(emailMode === "signup" ? "login" : "signup");
                  setError(null);
                  setResetSent(false);
                }}
                className="font-medium text-accent-ink hover:underline"
              >
                {emailMode === "signup" ? t("Кириш") : t("Бепул рўйхатдан ўтиш")}
              </button>
            </p>
          </form>
        )}

        {/* ---------- УСУЛНИ АЛМАШТИРИШ ---------- */}
        <div className="mt-4 space-y-2 border-t border-line pt-4">
          {step !== "email" ? (
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
              }}
              className="block w-full text-center text-caption text-ink-3 hover:text-ink"
            >
              {t("Email ва парол билан кириш")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setError(null);
              }}
              className="block w-full text-center text-caption text-ink-3 hover:text-ink"
            >
              {t("Телефон рақами билан кириш")}
            </button>
          )}

          {/* Қўлланма кириш ТАЛАБ ҚИЛМАЙДИ: ишонтириш керак бўлган одам
              логинда турибди, тизимнинг ичида эмас. */}
          <p className="text-center text-caption text-ink-3">
            <NextLink
              href={path("guide", locale)}
              className="font-medium text-accent-ink hover:underline"
            >
              {t("Тизим қандай ишлайди?")}
            </NextLink>
          </p>
        </div>
      </Card>
    </div>
  );
}
