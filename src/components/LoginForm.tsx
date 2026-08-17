"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLocale, useT } from "@/context/LanguageContext";
import { path } from "@/lib/routes";
import Logo from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { Alert, Badge, Button, Card, Field, Input, layout } from "@/components/ui";

/* ============================================================
   SINOV HISOBI — FAQAT ISHLAB CHIQISH REJIMIDA
   ------------------------------------------------------------
   `process.env.NODE_ENV` ni Next QURISH PAYTIDA matn bilan
   almashtiradi. Ya'ni ishlab chiqarish qurilmasida bu shart
   `"production" === "development"` bo'lib qoladi va bundler butun
   shoxni olib tashlaydi — email ham, parol ham chiqarilgan JS
   faylga UMUMAN TUSHMAYDI.
   Buni tekshirish oson: `npx next build` dan keyin `.next` ichida
   qidiruv hech narsa topmasligi kerak.

   Nega bu muhim: oldingi sessiyada login sahifasidan aynan shunday
   tayyor parol OLIB TASHLANGAN edi, chunki u ochiq mahsulotda
   turardi. Endi u qaytdi, lekin dev-rejim devori bilan.
   ============================================================ */
const IS_DEV = process.env.NODE_ENV === "development";
const DEV_EMAIL = IS_DEV ? "webleaders.uz@gmail.com" : "";
const DEV_PASSWORD = IS_DEV ? "12345678" : "";

export default function LoginForm() {
  const t = useT();
  const locale = useLocale();
  const [email, setEmail] = useState(DEV_EMAIL);
  const [password, setPassword] = useState(DEV_PASSWORD);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);

  const { login, signup } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    if (mode === "signup") {
      const message = await signup(email, password);
      if (message) setError(message);
    } else {
      await login(email, password);
    }
    setIsSubmitting(false);
  };

  return (
    <div className={`${layout.page} relative flex items-center justify-center overflow-hidden px-4`}>
      {/* Фон — бош саҳифадаги АЙНАН ўша тўр ва нурланиш. Логин
          алоҳида дастур эмас, ўша саҳифанинг давоми экани
          кўриниб турсин. */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 0%, color-mix(in srgb, var(--brand-out) 16%, transparent) 0%, transparent 70%), " +
            "radial-gradient(50% 50% at 50% 100%, color-mix(in srgb, var(--brand-in) 16%, transparent) 0%, transparent 70%)",
        }}
      />

      {/* Логотип бош саҳифага олиб боради: логинда турган одам
          «бу нима эди?» деса, орқага йўл бўлиши керак. */}
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

      {/* 3-поғона — карта фондан УЗИЛГАН қатлам: диққат фақат
          шу ерда бўлиши керак. */}
      <Card elevation={3} className="relative z-10 w-full max-w-sm rounded-xl p-6">
        <div className="mb-6">
          <h1 className="text-h2 font-semibold text-ink">
            {mode === "signup" ? t("Рўйхатдан ўтиш") : t("Тизимга кириш")}
          </h1>
          <p className="mt-1.5 text-body text-ink-2">
            {mode === "signup"
              ? t("Бепул: 3 та корхона, сверка чексиз")
              : t("Бухгалтер учун автоматик текширув тизими")}
          </p>
        </div>

        {IS_DEV && (
          // Ишлаб чиқаришда бу белги ҳам чиқмайди — шарт билан бирга
          // йўқолади. Мақсади: дастурчи «нега майдонлар тўла?» деб
          // ҳайрон бўлмасин.
          <Badge tone="warn" className="mb-4">
            {t("Синов режими — маълумотлар олдиндан тўлдирилган")}
          </Badge>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
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
            hint={mode === "signup" ? t("Камида 6 та белги") : undefined}
          >
            <Input
              id="password"
              type="password"
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === "signup" ? 6 : undefined}
            />
          </Field>

          {error && <Alert tone="bad">{error}</Alert>}

          <Button type="submit" variant="primary" block loading={isSubmitting}>
            {isSubmitting
              ? t("Текширилмоқда...")
              : mode === "signup"
                ? t("Бепул бошлаш")
                : t("Тизимга кириш")}
          </Button>

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

          <p className="text-center text-caption text-ink-3">
            {mode === "signup" ? t("Аллақачон ҳисобингиз борми?") : t("Ҳисобингиз йўқми?")}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setError(null);
              }}
              className="font-medium text-accent-ink hover:underline"
            >
              {mode === "signup" ? t("Кириш") : t("Бепул рўйхатдан ўтиш")}
            </button>
          </p>
        </form>
      </Card>
    </div>
  );
}
